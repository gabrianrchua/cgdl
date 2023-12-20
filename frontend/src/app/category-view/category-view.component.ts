import { NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Navigation, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-category-view',
  standalone: true,
  imports: [ MatButtonModule, MatIconModule, RouterModule, NgIf, NgFor, MatProgressSpinnerModule ],
  templateUrl: './category-view.component.html',
  styleUrl: './category-view.component.scss'
})
export class CategoryViewComponent {
  constructor(private http: HttpClient, private router: Router) {
    let curNav: Navigation | null = router.getCurrentNavigation();
    let desc: string = "";
    if (curNav) {
      desc = curNav.extras.state ? curNav.extras.state["description"] : "";
    } else {
      console.warn("Failed to get description, showing empty description for this category");
    }
    this.categoryData = {
      categoryName: router.routerState.snapshot.url.slice(1),
      categoryDescription: desc,
      items: undefined // updated after fetching from server
    }
    this.getItems();
  }

  getItems() {
    let url: string = "http://localhost:80/api/categories/" + this.categoryData?.categoryName;
    this.http.get<ItemsResponse>(url).subscribe(data => {
      if (this.categoryData) {
        this.categoryData.items = data.result;
      } else {
        console.warn("Category data updated before initialization!");
      }
      console.log(this.categoryData?.items);
    });
  }

  categoryData: CategoryItemData | undefined;
}

export interface CategoryItemData {
  categoryName: string,
  categoryDescription: string,
  items: Item[] | undefined
}

export interface Item {
  id: number,
  Name: string,
  Description: string,
  Link: string
}

export interface ItemsResponse {
  status: string,
  result: Item[]
}