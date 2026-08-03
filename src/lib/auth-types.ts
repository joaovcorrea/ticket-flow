export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  papel: string;
  avatar?: string | null;
  idDepartamento?: number | null;
}
