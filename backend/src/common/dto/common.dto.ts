export class AuthUserDTO {
    user_id: number;
    user_id_public: string;
    user_email: string | null;
    user_is_guest: boolean;
    user_installation_id: string | null;
}
