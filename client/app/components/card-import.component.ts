import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
    moduleId: module.id,
    selector: 'card-import',
    templateUrl: 'card-import.component.html'
})
export class CardImportComponent implements OnInit {
    form: FormGroup;
    error: string;
    success: boolean;
    loading = false;

    constructor(private apiService: ApiService, private fb: FormBuilder) { }

    ngOnInit() {
        this.form = this.fb.group({
            'username': ['', Validators.required],
            'password': ['nobody cares any more..', Validators.required]
        });
    }

    import() {
        this.loading = true;
        this.apiService.importCollection(this.form.value).subscribe(result => {
            this.error = result.error;
            this.success = result.success;
            this.loading = false;
        });
    }
}
