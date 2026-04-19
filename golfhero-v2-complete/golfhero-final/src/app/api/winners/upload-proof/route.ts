import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const resultId = formData.get('result_id') as string

    if (!file || !resultId) {
      return NextResponse.json({ error: 'Missing file or result_id' }, { status: 400 })
    }

    // Verify this result belongs to this user
    const { data: result } = await supabase
      .from('draw_results')
      .select('id, user_id, verification_status')
      .eq('id', resultId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 })
    }

    if (result.verification_status !== 'pending') {
      return NextResponse.json({ error: 'Proof already submitted or reviewed' }, { status: 400 })
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only image files are allowed (JPG, PNG, WebP)' }, { status: 400 })
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${resultId}_${Date.now()}.${fileExt}`

    // Upload to Supabase Storage (create 'winner-proofs' bucket in Supabase dashboard)
    const { data: upload, error: uploadError } = await supabase.storage
      .from('winner-proofs')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('winner-proofs')
      .getPublicUrl(fileName)

    // Update draw result with proof URL
    const { error: updateError } = await supabase
      .from('draw_results')
      .update({
        proof_url: urlData.publicUrl,
        verification_status: 'proof_submitted',
        proof_submitted_at: new Date().toISOString(),
      })
      .eq('id', resultId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      proof_url: urlData.publicUrl,
      message: 'Proof submitted successfully. Our team will review within 2 business days.',
    })

  } catch (error: any) {
    console.error('Proof upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
