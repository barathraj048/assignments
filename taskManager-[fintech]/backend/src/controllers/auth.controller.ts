import type { Request,Response } from "express";
import {set, string, z } from "zod";
import {prisma}  from "../utils/prisma.js";
import bcrypt from "bcrypt";
import { signinAccessToken,signinRefreshToken,verifyAccessToken, verifyRefreshToken } from "../utils/jwt.js";

const soltrounds=10

const regesterSchema=z.object({
   name:z.string().min(3,"Name must be at least 3 characters long"),
   email:z.email("Invalid email address"),
   password:z.string().min(6,"Password must be at least 6 characters long")
})

const loginSchema=z.object({
   name:z.string().min(3,"Name must be at least 3 characters long").optional(),
   email:z.email("Invalid email address"),
   password:z.string().min(6,"Password must be at least 6 characters long")
})

const REFRESH_COOKIE_OPTIONS={
   httpOnly:true,
   secure: process.env.NODE_ENV === "production",
   sameSite:"strict" as const,
   maxAge:7*24*60*60*1000,
   path:"/auth"
}

let setRefreshTokenCookie =(res:Response,refreshToken:string)=> {
   res.cookie("refreshToken",refreshToken,REFRESH_COOKIE_OPTIONS)
}
let clearRefreshTokenCookie=(res:Response)=>{
   res.clearCookie("refreshToken",{...REFRESH_COOKIE_OPTIONS,maxAge:0})
}

export const regester =async (req:Request,res:Response):Promise<void>=> {
   let recived=regesterSchema.safeParse(req.body)
   if(!recived.success){
      res.status(400).json({message:"Invalid input data"})
      return
   }
   const {name,email,password}=recived.data
   if(await prisma.user.findUnique({where:{email}})){
      res.status(400).json({message:"Email already exists, please choose another one or goto Login"})
   }
   const hash=await bcrypt.hash(password,soltrounds)
   const user=await prisma.user.create({
      data:{
               name,
               email,
               password:hash
            },
      select:{
         id:true,
         name:true,
         email:true,  
      }})
   res.status(201).json({message:"User created successfully",user})
   const accessTocken=signinAccessToken({email:user.email,userId:user.id})
   const refreshTocken=signinRefreshToken({email:user.email,userId:user.id})   
   
   const hashedRefreshToken=await bcrypt.hash(refreshTocken,soltrounds)
   await prisma.user.update({
      where:{id:user.id},
      data:{refreshToken:hashedRefreshToken}})

   setRefreshTokenCookie(res,refreshTocken)  
   res.status(200).json({user,accessTocken})
   }

export const login=async (req:Request,res:Response):Promise<void>=> {
   let reccives=loginSchema.safeParse(req.body)
   if(!reccives.success){
      res.status(400).json({message:"Invalid input data"})
      return
   }
   let {email,password}=reccives.data
   const user=await prisma.user.findUnique({where:{email}})
   if(!user){
      res.status(400).json({message:"Invalid email or Ther is no record for this email try signing up"})
      return
   }
   const isPasswordValid=await bcrypt.compare(password,user.password)
   if(!isPasswordValid){
      res.status(400).json({message:"Invalid password"})
      return
   }
   const accessTocken=signinAccessToken({email:user.email,userId:user.id})
   const refreshTocken=signinRefreshToken({email:user.email,userId:user.id})

   setRefreshTokenCookie(res,refreshTocken)
   const hashedRefreshToken=await bcrypt.hash(refreshTocken,soltrounds)
   await prisma.user.update({
      where:{id:user.id},
      data:{refreshToken:hashedRefreshToken}})
   res.status(200).json({user,accessTocken})
}

export const refresh=async(req:Request,res:Response):Promise<void>=> {
   const refreshToken=req.cookies?.refreshToken as string | undefined
   if(!refreshToken){
      res.status(400).json({message:"No refresh token found"})
      return
   }
   let payload:{
      userId:string,
      email:string
   }
   try{
      payload=verifyAccessToken(refreshToken)
   }catch(error){
      res.status(400).json({message:"Invalid refresh token"})
      return
   }
   let user=await prisma.user.findUnique({where:{id:payload.userId}})
   if(!user || !user.refreshToken){
      res.status(400).json({message:"Invalid refresh token"})
      return
   }
   const isRefreshTokenValid=await bcrypt.compare(refreshToken,user.refreshToken)
   if(!isRefreshTokenValid){
      prisma.user.update({
         where:{id:payload.userId},
         data:{refreshToken:null}
   })
   clearRefreshTokenCookie(res)
   res.status(401).json({message:"token reused detected, all sessions have been revoked, please login again"})
   return
}
   const accessTocken=signinAccessToken({email:user.email,userId:user.id})
   const newRefreshTocken=signinRefreshToken({email:user.email,userId:user.id})
   const hashedRefreshToken=await bcrypt.hash(newRefreshTocken,soltrounds)
   await prisma.user.update({
      where:{id:user.id},
      data:{refreshToken:hashedRefreshToken}})
   setRefreshTokenCookie(res,newRefreshTocken)
   res.status(200).json({accessTocken})
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken as string | undefined;

  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await prisma.user.update({
        where: { id: payload.userId },
        data: { refreshToken: null },
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }

  clearRefreshTokenCookie(res);
  res.json({ message: "Logged out successfully" });
}