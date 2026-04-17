import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonButton,
  IonBackButton,
  IonButtons
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-order',
  templateUrl: './order.page.html',
  styleUrls: ['./order.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonItem, 
    IonLabel, 
    IonInput, 
    IonButton,
    IonBackButton,
    IonButtons
  ]
})
export class OrderPage implements OnInit {
  productId!: number;
  quantity = 1;
  resultMessage = '';
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.productId = id ? Number(id) : 0;
  }

  submitOrder() {
    if (this.quantity < 1) {
      this.errorMessage = 'Quantity must be at least 1';
      return;
    }

    this.isSubmitting = true;
    this.resultMessage = '';
    this.errorMessage = '';

    this.api.createOrder({
      productId: this.productId,
      quantity: this.quantity
    }).subscribe({
      next: (res) => {
        this.resultMessage = `✅ Order placed successfully!\nOrder ID: ${res.orderId}\nTotal Price: ₹${res.totalPrice}`;
        this.errorMessage = '';
        this.isSubmitting = false;
        
        // Redirect back to products after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 2000);
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to place order';
        this.resultMessage = '';
        this.isSubmitting = false;
        console.error(err);
      }
    });
  }
}