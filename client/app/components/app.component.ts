import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ConfigService, cardStyles } from '../services/config.service';
import { FormGroup, FormBuilder } from '@angular/forms';
@Component({
    moduleId: module.id,
    selector: 'hs-app',
    templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {
    cardStyles = cardStyles;
    configForm: FormGroup;
    isCollapsed = true;

    constructor(private authService: AuthService, private configService: ConfigService, private fb: FormBuilder) {
    }

    ngOnInit() {
        this.configForm = this.fb.group({
            'cardStyle': this.configService.config.cardStyle + '',
            'enableCardAvailSelector': this.configService.config.enableCardAvailSelector,
            'standart': this.configService.config.standart
        });

        this.configForm.valueChanges.subscribe(v => this.configService.config = {
            cardStyle: +v.cardStyle,
            enableCardAvailSelector: !!v.enableCardAvailSelector,
            splitCardListByClass: this.configService.config.splitCardListByClass,
            standart: v.standart
        });

        this.authService.authChanged.subscribe(rez => {
            this.configService.refresh();
            this.configForm.reset(this.configService.config);
        });
    }


    isAuthenticated() {
        return this.authService.isAuthenticated();
    }

    logout($event: Event) {
        if ($event) {
            $event.preventDefault();
        }
        this.authService.logout();
    }

    get username() {
        return this.authService.userName;
    }

}
