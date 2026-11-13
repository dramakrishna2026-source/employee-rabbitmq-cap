namespace employee;

using { cuid, managed } from '@sap/cds/common';

entity Employees : cuid, managed {
  employeeNumber : String(20) not null;
  firstName      : String(60) not null;
  lastName       : String(60);
  email          : String(120);
  department     : String(60);
  salary         : Decimal(12,2);
  active         : Boolean default true;
}
