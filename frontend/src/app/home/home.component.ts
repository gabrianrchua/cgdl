import { NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ MatButtonModule, MatIconModule, RouterModule, NgIf, MatProgressSpinnerModule, NgFor ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor(private http: HttpClient) {
    this.getCategories();
  }

  categories: Category[] | undefined
  
  getCategories() {
    this.http.get<CategoriesResponse>("http://localhost:80/api/categories").subscribe(data => {
      this.categories = data.result;
      console.log(this.categories);
    });
  }
}

export interface CategoriesResponse {
  status: string,
  result: Category[]
}

export interface Category {
  id: number,
  Name: string,
  Description: string
}