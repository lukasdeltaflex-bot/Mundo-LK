export interface UserProps {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
  role: 'ADMIN' | 'AFFILIATE';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
}

export class User {
  public readonly uid: string;
  public name: string;
  public email: string;
  public photoURL: string | null;
  public role: 'ADMIN' | 'AFFILIATE';
  public status: 'ACTIVE' | 'INACTIVE';
  public createdAt: Date;
  public updatedAt: Date;
  public lastLogin: Date;

  constructor(props: UserProps) {
    this.uid = props.uid;
    this.name = props.name;
    this.email = props.email;
    this.photoURL = props.photoURL || null;
    this.role = props.role || 'AFFILIATE';
    this.status = props.status || 'ACTIVE';
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
    this.lastLogin = props.lastLogin || new Date();
  }

  public updateLastLogin(): void {
    this.lastLogin = new Date();
    this.updatedAt = new Date();
  }
}
