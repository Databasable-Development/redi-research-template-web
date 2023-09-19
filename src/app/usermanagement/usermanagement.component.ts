import {Component, OnDestroy, OnInit} from '@angular/core';
import {GridOptions, SelectionChangedEvent} from 'ag-grid-community';
import {User, UserAuthResponse} from '../models/user';
import {ApiService} from '../services/api.service';
import {forkJoin} from 'rxjs';

@Component({
    selector: 'app-usermanagement',
    templateUrl: './usermanagement.component.html',
    styleUrls: ['./usermanagement.component.scss']
})
export class UsermanagementComponent implements OnInit, OnDestroy {
    isAdmin = true;
    gridOptions: GridOptions;
    newUser = new User();
    loading = false;
    selectedUsers = new Array<User>();

    constructor(private api: ApiService) {
        this.gridOptions = {};
    }

    ngOnInit(): void {
        this.setGrid()
    }

    ngOnDestroy(): void {

    }

    deleteSelected() {
        this.loading = true;
        const obs = [];
        for (const user of this.selectedUsers) {
            obs.push(this.api.disableUser(user));
        }

        forkJoin(obs)
            .subscribe(() => {
                this.loading = false;
                this.gridOptions.api?.applyTransaction({remove: this.selectedUsers});
                this.selectedUsers = [];
            }, err => {
                alert(err.error);
                this.loading = false;
            });
    }

    createUser() {
        this.loading = true;
        this.api.createUser(this.newUser)
            .subscribe((resp: UserAuthResponse) => {
                this.newUser.CognitoId = resp.UserId;
                debugger;
                this.gridOptions.api?.applyTransaction({add: [this.newUser]});
                this.loading = false;
                this.newUser = new User();
            }, err => {
                debugger;
                alert(err.error);
                this.loading = false;
            })
    }

    setGrid() {
        const self = this;
        this.gridOptions = {
            rowSelection: 'single',
            paginationPageSize: 500,
            context: {
                parentComponent: this
            },
            overlayNoRowsTemplate: `<span class="ag-overlay-loading-center">No rows to show</span>`,
            onSelectionChanged(event: SelectionChangedEvent) {
                const selectedData = self.gridOptions.api?.getSelectedRows() as User[];
                self.selectedUsers = selectedData;
            }
        };

        this.gridOptions.onGridReady = async () => {
            this.api.getUsers()
                .subscribe(users => {
                    this.gridOptions.api?.setRowData(users);
                }, err => {
                    alert(err.error);
                })
        };

        this.gridOptions.columnDefs = [
            {
                headerName: 'First Name',
                field: 'FirstName',
                editable: false,
                filter: 'agTextColumnFilter',
                checkboxSelection: true,
            },
            {
                headerName: 'Last Name',
                field: 'LastName',
                editable: false,
                filter: 'agTextColumnFilter',
            },
            {
                headerName: 'Email',
                field: 'LastName',
                editable: false,
                filter: 'agTextColumnFilter',
            },
            {
                headerName: 'Is Admin',
                field: 'IsAdmin',
                editable: false,
                filter: 'agTextColumnFilter',
                valueFormatter: (params: any) => {
                    return params.value ? 'Yes' : 'No';
                }
            },
            {
                headerName: 'Last Activity',
                field: 'LastActivity',
                editable: false,
                valueFormatter: (params: any) => {
                    return params.value ? new Date(params.value * 1000).toLocaleDateString() : '';
                }
            },
        ]
    }
}
