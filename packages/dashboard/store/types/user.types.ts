// /store/types/user.types.ts
export interface User {
    firstName: string;
    lastName: string;
  }
  
  export interface UserSlice {
    user: User | null;
    setUser: (user: User) => void;
    updateFirstName: (firstName: string) => void;
    updateLastName: (lastName: string) => void;
    clearUser: () => void;
  }