import type { UserPostItem, UserProfileAbout, UserProfileSocials } from './types';

export const _userAbout: UserProfileAbout = {
  quote:
    'Tart I love sugar plum I love oat cake. Sweet roll caramels I love jujubes. Topping cake wafer.',
  country: 'United Kingdom',
  email: 'ashlynn.ohara62@gmail.com',
  role: 'CTO at Gleichner, Mueller and Tromp',
  school: 'Studied at Nikolaus - Leuschke',
};

export const _userFollowers = {
  follower: 1947,
  following: 9124,
};

export const _userSocials: UserProfileSocials = {
  facebook: 'https://www.facebook.com/frankie',
  instagram: 'https://www.instagram.com/frankie',
  linkedin: 'https://www.linkedin.com/in/frankie',
  twitter: 'https://www.twitter.com/frankie',
};

export const _userPosts: UserPostItem[] = [
  {
    id: 'post-1',
    author: {
      name: 'Usuário',
      avatarUrl: '',
    },
    createdAt: '16 Nov 2026',
    message: 'The sun slowly set over the horizon, painting the sky in vibrant hues of orange and pink.',
    media: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&auto=format&fit=crop&q=80',
    likes: 20,
    comments: [
      {
        id: 'c-1',
        author: {
          name: 'Lainey Davidson',
          avatarUrl: '',
        },
        createdAt: '16 Nov 2026',
        message: 'Praesent venenatis metus at.',
      },
      {
        id: 'c-2',
        author: {
          name: 'Cristopher Cardenas',
          avatarUrl: '',
        },
        createdAt: '15 Nov 2026',
        message:
          'Etiam rhoncus. Nullam vel sem. Pellentesque libero tortor, tincidunt et, tincidunt eget, semper nec, quam. Sed lectus.',
      },
    ],
  },
  {
    id: 'post-2',
    author: {
      name: 'Usuário',
      avatarUrl: '',
    },
    createdAt: '15 Nov 2026',
    message: 'She eagerly opened the gift, her eyes sparkling with excitement.',
    media: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    likes: 35,
    comments: [],
  },
];
