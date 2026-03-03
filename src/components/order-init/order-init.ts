import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../../services/customer/customer.service';
import { catchError, of, switchMap } from 'rxjs';

@Component({
    selector: 'app-order-init',
    standalone: true,
    imports: [],
    templateUrl: './order-init.html',
    styleUrl: './order-init.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderInitComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private customerService = inject(CustomerService);

    // State Signals
    restaurantId = signal<string | null>(null);
    tableId = signal<string | null>(null);
    isLoading = signal(true);
    error = signal(false);
    errorMessage = signal<string | null>(null);

    ngOnInit() {
        this.initializeOrderFlow();
    }

    initializeOrderFlow() {
        const qrId = this.route.snapshot.queryParamMap.get('qrId');

        if (!qrId) {
            this.handleError('Invalid or missing QR code. Please scan again.');
            return;
        }

        // In the secure flow, the backend handles the mapping and status check
        // We directly request a session token using the qrId
        this.customerService.generateSessionToken(qrId).pipe(
            catchError((err: Error) => {
                this.handleError(err.message || 'Failed to initialize order session.');
                return of(null);
            })
        ).subscribe({
            next: (res: any) => {
                if (res && res.sessionToken) {
                    // Success! Redirect to menu page (which calls http://localhost:8085/menu/items)
                    this.router.navigate(['/menu']);
                }
            }
        });
    }

    private handleError(message: string) {
        this.isLoading.set(false);
        this.error.set(true);
        this.errorMessage.set(message);
    }

    retry() {
        this.isLoading.set(true);
        this.error.set(false);
        this.errorMessage.set(null);
        this.initializeOrderFlow();
    }
}
