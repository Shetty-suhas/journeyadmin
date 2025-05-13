import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  tabs = ['Flights', 'Buses', 'Hotels', 'Bookings'];
  activeTab = 'Flights';
  flightForm: FormGroup;
  busForm: FormGroup;
  hotelForm: FormGroup;
  cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
    'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];
  fromCities = [...this.cities];
  toCities = [...this.cities];
  busFromCities = [...this.cities];
  busToCities = [...this.cities];
  flightMessage: string | null = null;
  flightError = false;
  busMessage: string | null = null;
  busError = false;
  hotelMessage: string | null = null;
  hotelError = false;
  imageValid = true;
  bookings: any[] = [];
  bookingsError: string | null = null;
  private apiUrl = 'http://localhost:5000';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    // Flight Form
    this.flightForm = this.fb.group({
      flightNumber: ['', Validators.required],
      airline: ['', Validators.required],
      departureTime: ['', Validators.required],
      departureCity: [''],
      departureAirport: ['', Validators.required],
      departureDate: ['', Validators.required],
      arrivalTime: ['', Validators.required],
      arrivalCity: [''],
      arrivalAirport: ['', Validators.required],
      arrivalDate: ['', Validators.required],
      duration: ['', Validators.required],
      stops: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(1)]],
      seatsAvailable: [{ value: 180, disabled: true }],
      features: ['', Validators.required],
      to: ['', Validators.required],
      from: ['', Validators.required]
    });

    // Bus Form
    this.busForm = this.fb.group({
      company: ['', Validators.required],
      type: ['', Validators.required],
      from: ['', Validators.required],
      to: ['', Validators.required],
      departureDate: ['', Validators.required],
      departureTime: ['', Validators.required],
      departureLocation: ['', Validators.required],
      arrivalTime: ['', Validators.required],
      arrivalLocation: ['', Validators.required],
      duration: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      seatsAvailable: [{ value: 39, disabled: true }],
      features: ['', Validators.required]
    });

    // Hotel Form
    this.hotelForm = this.fb.group({
      name: ['', Validators.required],
      city: ['', Validators.required],
      rating: ['', [Validators.required, Validators.min(0), Validators.max(5)]],
      location: ['', Validators.required],
      originalPrice: ['', [Validators.required, Validators.min(0)]],
      discountedPrice: ['', [Validators.required, Validators.min(0)]],
      amenities: ['', Validators.required],
      image: ['']
    });

    this.loadBookings();
  }

  selectTab(tab: string) {
    this.activeTab = tab;
  }

  updateToCities() {
    const fromCity = this.flightForm.get('from')?.value;
    this.toCities = this.cities.filter(city => city !== fromCity);
    if (this.flightForm.get('to')?.value === fromCity) {
      this.flightForm.get('to')?.setValue('');
    }
  }

  updateBusToCities() {
    const fromCity = this.busForm.get('from')?.value;
    this.busToCities = this.cities.filter(city => city !== fromCity);
    if (this.busForm.get('to')?.value === fromCity) {
      this.busForm.get('to')?.setValue('');
    }
  }

  loadBookings() {
    this.http.get<any[]>(`${this.apiUrl}/bookings`).subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.bookingsError = null;
      },
      error: (error) => {
        this.bookingsError = error.error?.error || 'Failed to load bookings';
        this.bookings = [];
      }
    });
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.imageValid = false;
        this.hotelForm.get('image')?.setValue('');
        return;
      }
      this.imageValid = true;
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1]; // Remove data:image/...;base64,
        this.hotelForm.get('image')?.setValue(base64String);
      };
      reader.readAsDataURL(file);
    }
  }

  addFlight() {
    if (this.flightForm.invalid) {
      this.flightForm.markAllAsTouched();
      return;
    }

    const flightData = {
      ...this.flightForm.getRawValue(),
      seatsAvailable: 180
    };

    this.http.post(`${this.apiUrl}/flights`, flightData).subscribe({
      next: (response) => {
        this.flightMessage = 'Flight added successfully!';
        this.flightError = false;
        this.flightForm.reset({ seatsAvailable: { value: 180, disabled: true } });
        this.toCities = [...this.cities];
      },
      error: (error) => {
        this.flightMessage = error.error?.error || 'Failed to add flight';
        this.flightError = true;
      }
    });
  }

  addBus() {
    if (this.busForm.invalid) {
      this.busForm.markAllAsTouched();
      return;
    }

    const busData = {
      ...this.busForm.getRawValue(),
      seatsAvailable: 39
    };

    this.http.post(`${this.apiUrl}/buses`, busData).subscribe({
      next: (response) => {
        this.busMessage = 'Bus added successfully!';
        this.busError = false;
        this.busForm.reset({ seatsAvailable: { value: 39, disabled: true } });
        this.busToCities = [...this.cities];
      },
      error: (error) => {
        this.busMessage = error.error?.error || 'Failed to add bus';
        this.busError = true;
      }
    });
  }

  addHotel() {
    if (this.hotelForm.invalid || !this.imageValid) {
      this.hotelForm.markAllAsTouched();
      return;
    }

    const hotelData = {
      ...this.hotelForm.value,
      amenities: this.hotelForm.value.amenities.split(',').map((item: string) => item.trim()).filter((item: string) => item)
    };

    this.http.post(`${this.apiUrl}/hotels`, hotelData).subscribe({
      next: (response) => {
        this.hotelMessage = 'Hotel added successfully!';
        this.hotelError = false;
        this.hotelForm.reset();
        this.imageValid = true;
      },
      error: (error) => {
        this.hotelMessage = error.error?.error || 'Failed to add hotel';
        this.hotelError = true;
      }
    });
  }
}