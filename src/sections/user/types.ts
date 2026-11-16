export type UserProfile = {
  id: string;
  name: string;
  role: string;
  coverUrl?: string;
  avatarUrl?: string;
};

export type UserProfileAbout = {
  quote?: string;
  country: string;
  email: string;
  role: string;
  school: string;
};

export type UserProfileSocials = {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
};

export type UserPostComment = {
  id: string;
  author: {
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  message: string;
};

export type UserPostItem = {
  id: string;
  author: {
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  message: string;
  media?: string;
  likes: number;
  comments: UserPostComment[];
};
