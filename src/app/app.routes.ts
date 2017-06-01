// Exports all routes for Angular Router
import { AuthGuard }                  from './authguard.service';
import { Route }                      from  '@angular/router';

// Ours
import { DashboardComponent }         from './dashboard.component';
import { DashboardManagerComponent }  from './dashboard.manager.component';
import { DataSourceComponent }        from './datasource.component';
import { GroupComponent }             from './group.component';
import { LoginComponent }             from './login.component';
import { MessageManagerComponent }    from './message.manager.component';
import { MyProfileComponent }         from './myprofile.component';
import { PageNotFoundComponent }      from './pagenotfound.component';
import { ReportComponent }            from './report.component';
import { SystemConfigComponent }      from './systemconfig.component';
import { UserComponent}               from './user.component';

export const routes: Route[] = [

  { 
    path: '', 
    redirectTo: '/pagenotfound', 
    pathMatch: 'full' 
  },
  { 
    path: 'startup',                  
    component: PageNotFoundComponent,     
    canActivate: [AuthGuard]
  },
  { 
    path: 'users',                    
    component: UserComponent,             
    canActivate: [AuthGuard]
  },
  { 
    path: 'group',                    
    component: GroupComponent,             
    canActivate: [AuthGuard]
  },  
  { 
    path: 'dashboard',                
    component: DashboardComponent,        
    canActivate: [AuthGuard]
  },
  { 
    path: 'dashboardManager',         
    component: DashboardManagerComponent, 
    canActivate: [AuthGuard]
  },
  { 
    path: 'dataSource',         
    component: DataSourceComponent, 
    canActivate: [AuthGuard]
  },
  { 
    path: 'report',         
    component: ReportComponent, 
    canActivate: [AuthGuard]
  },
  { 
    path: 'myprofile',         
    component: MyProfileComponent, 
    canActivate: [AuthGuard]
  },
  { 
    path: 'systemconfig',         
    component: SystemConfigComponent, 
    canActivate: [AuthGuard]
  },
  { 
    path: 'messageManager',         
    component: MessageManagerComponent, 
    canActivate: [AuthGuard]
  },
  { 
    path: 'pagenotfound',             
    component: PageNotFoundComponent
  },  
  { 
    path: '**',                       
    component: PageNotFoundComponent
  }  
]


