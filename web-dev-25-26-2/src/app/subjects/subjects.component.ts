import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ApiService, Subject } from '../services/api.service';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    TableModule,
    ReactiveFormsModule,
  ],
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.scss',
})
export class SubjectsComponent implements OnInit {
  subjectForm: FormGroup;
  subjects: Subject[] = [];
  loading = false;
  error: string | null = null;
  editingSubject: Subject | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.subjectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2)]],
      credits: [
        '',
        [Validators.required, Validators.min(1)],
      ],
    });
  }

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.loading = true;
    this.error = null;
    this.apiService.getSubjects().subscribe({
      next: (subjects) => {
        this.subjects = subjects;
        this.loading = false;
      },
      error: (err) => {
        this.error =
          'Failed to load subjects: ' + (err.error?.error || err.message);
        this.loading = false;
        console.error('Error loading subjects:', err);
      },
    });
  }

  onSubmit(): void {
    if (!this.subjectForm.valid) {
      this.subjectForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.subjectForm.value;
    const subjectData = {
      name: formValue.name,
      code: formValue.code,
      credits: Number(formValue.credits),
    };

    if (this.editingSubject?.id) {
      // Update existing subject
      this.apiService
        .updateSubject(this.editingSubject.id, subjectData)
        .subscribe({
          next: (updatedSubject) => {
            const index = this.subjects.findIndex(
              (s) => s.id === updatedSubject.id
            );
            if (index !== -1) {
              this.subjects[index] = updatedSubject;
            }
            this.cancelEdit();
            this.loading = false;
          },
          error: (err) => {
            this.error =
              'Failed to update subject: ' + (err.error?.error || err.message);
            this.loading = false;
            console.error('Error updating subject:', err);
          },
        });
    } else {
      // Create new subject
      this.apiService.createSubject(subjectData).subscribe({
        next: (subject) => {
          this.subjects.push(subject);
          this.subjectForm.reset();
          this.loading = false;
        },
        error: (err) => {
          this.error =
            'Failed to create subject: ' + (err.error?.error || err.message);
          this.loading = false;
          console.error('Error creating subject:', err);
        },
      });
    }
  }

  editSubject(subject: Subject): void {
    this.editingSubject = subject;
    this.subjectForm.patchValue({
      name: subject.name,
      code: subject.code,
      credits: subject.credits,
    });

    // Scroll to form (като при University)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingSubject = null;
    this.subjectForm.reset();
  }

  deleteSubject(subject: Subject): void {
    if (!subject.id) return;

    if (confirm(`Are you sure you want to delete subject "${subject.name}"?`)) {
      this.loading = true;
      this.error = null;

      this.apiService.deleteSubject(subject.id).subscribe({
        next: () => {
          this.subjects = this.subjects.filter((s) => s.id !== subject.id);
          this.loading = false;
        },
        error: (err) => {
          this.error =
            'Failed to delete subject: ' + (err.error?.error || err.message);
          this.loading = false;
          console.error('Error deleting subject:', err);
        },
      });
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.subjectForm.get(fieldName);
    if (field?.touched && field.invalid) {
      if (field.errors?.['required']) {
        return 'This field is required';
      }
      if (field.errors?.['minlength']) {
        return 'Minimum length is 2 characters';
      }
      if (field.errors?.['min']) {
        return 'Credits must be at least 1';
      }
    }
    return '';
  }
}