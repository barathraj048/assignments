import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonButton, 
  IonSpinner 
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ApiService, Product } from '../../services/api.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonButton, 
    IonSpinner
  ]
})
export class ProductsPage implements OnInit {
  products: Product[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private api: ApiService, 
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.api.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load products';
        this.loading = false;
        console.error(err);
      }
    });
  }

  openOrder(id: number) {
    this.router.navigate(['/order', id]);
  }
}