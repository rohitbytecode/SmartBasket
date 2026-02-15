import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-client-auth',
    templateUrl: './client-auth.component.html',
    styleUrls: ['./client-auth.component.scss']
})
export class ClientAuthComponent {
    loginForm: FormGroup;
    registerForm: FormGroup;
    loading = false;
    hidePassword = true;
    hideConfirmPassword = true;
    selectedTab = 0; // 0 for login, 1 for register

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        // Initialize login form
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });

        // Initialize register form
        this.registerForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: ClientAuthComponent.passwordMatchValidator });
    }

    // Custom validator to check if passwords match
    static passwordMatchValidator(form: FormGroup) {
        const password = form.get('password');
        const confirmPassword = form.get('confirmPassword');

        if (password && confirmPassword && password.value !== confirmPassword.value) {
            confirmPassword.setErrors({ passwordMismatch: true });
            return { passwordMismatch: true };
        }
        return null;
    }

    onLogin(): void {
        if (this.loginForm.valid) {
            this.loading = true;
            const { email, password } = this.loginForm.value;

            this.authService.login(email, password).subscribe({
                next: () => {
                    this.snackBar.open('Welcome back!', 'Close', { duration: 2000 });
                    this.router.navigate(['/']);
                },
                error: (error) => {
                    this.loading = false;
                    this.snackBar.open('Invalid credentials. Please try again.', 'Close', { duration: 3000 });
                }
            });
        }
    }

    onRegister(): void {
        if (this.registerForm.valid) {
            this.loading = true;
            const { name, email, password } = this.registerForm.value;

            this.authService.register(name, email, password).subscribe({
                next: () => {
                    this.snackBar.open('Registration successful! Welcome!', 'Close', { duration: 2000 });
                    this.router.navigate(['/']);
                },
                error: (error) => {
                    this.loading = false;
                    const message = error.error?.message || 'Registration failed. Please try again.';
                    this.snackBar.open(message, 'Close', { duration: 3000 });
                }
            });
        }
    }
}
