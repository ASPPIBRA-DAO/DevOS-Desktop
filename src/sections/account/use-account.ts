import { useState, useCallback } from 'react';

export type UserAccountData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  photoURL?: string | null;
  coverURL?: string | null;
  phoneNumber?: string;
  cpf?: string;
  rg?: string;
  rgIssuer?: string;
  cnh?: string;
  cnhCategory?: string;
  motherName?: string;
  fatherName?: string;
  birthDate?: string | null;
  nationality?: string;
  gender?: string;
  maritalStatus?: string;
  country: string;
  address: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  state: string;
  city: string;
  zipCode: string;
  occupation?: string;
  company?: string;
  website?: string;
  about?: string;
  isPublic: boolean;
  personType?: 'PF' | 'PJ';
  legalRepresentative?: string;
  legalRepresentativeCpf?: string;
};

const STORAGE_KEY = 'devos_user_account_profile';

const INITIAL_DATA: UserAccountData = {
  firstName: 'Sandro',
  lastName: 'de Souza',
  username: 'sandro_asppibra',
  email: 'sandro_ceo@asppibra.com.br',
  photoURL: null,
  coverURL: null,
  phoneNumber: '(21) 98765-4321',
  cpf: '123.456.789-00',
  rg: '20.123.456-7',
  rgIssuer: 'SSP/RJ',
  cnh: '04829104829',
  cnhCategory: 'AB',
  motherName: 'Maria Silva de Souza',
  fatherName: 'José de Souza',
  birthDate: '15/05/1985',
  nationality: 'Brasileira',
  gender: 'Masculino',
  maritalStatus: 'Casado(a)',
  country: 'Brasil',
  address: 'Estrada de Bambuí',
  addressNumber: 'Km 4',
  complement: '',
  neighborhood: 'Bambuí',
  state: 'RJ',
  city: 'Maricá',
  zipCode: '24900-000',
  occupation: 'Presidente Executivo / Operador de Nó',
  company: 'ASPPIBRA DAO',
  website: 'https://asppibra.org.br',
  about: 'Liderança associativa focada em regularização fundiária, moradia digna e governança digital Web3.',
  isPublic: true,
  personType: 'PF',
  legalRepresentative: '',
  legalRepresentativeCpf: '',
};

export function useAccountFacade() {
  const [user, setUser] = useState<UserAccountData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...INITIAL_DATA, ...JSON.parse(saved) };
      }
    } catch {
      // Ignora erro de JSON
    }
    return INITIAL_DATA;
  });

  const updateProfile = useCallback(async (data: Partial<UserAccountData>) => {
    setUser((prev) => {
      const updated = { ...prev, ...data };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignora erro de storage
      }
      return updated;
    });
  }, []);

  return {
    user,
    updateProfile,
  };
}
