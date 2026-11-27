// 소셜 로그인 인가 화면으로 보내는 공용 유틸
// 로그인 화면 버튼과, 다른 소셜 계정으로 가입된 이메일일 때 "기존 제공자로 계속하기" 버튼이 함께 쓴다

const redirectUrl = (provider) => `${import.meta.env.VITE_OAUTH_URL}/oauth/${provider}/redirect`;

const PROVIDERS = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/auth',
    clientId: '135548742889-hvh4kecrrcetaqv8dla9uggr483fukll.apps.googleusercontent.com',
    scope: 'openid email profile'
  },
  kakao: {
    authUrl: 'https://kauth.kakao.com/oauth/authorize',
    clientId: '1db026f5c4d2e11d7e597cdd4488d193'
  },
  naver: {
    authUrl: 'https://nid.naver.com/oauth2.0/authorize',
    clientId: 'GbQ_01jKVCMgOVze1pio'
  }
};

export const isSocialProvider = (provider) => Object.prototype.hasOwnProperty.call(PROVIDERS, provider);

export const buildSocialAuthUrl = (provider) => {
  const config = PROVIDERS[provider];
  if (!config) {
    throw new Error(`지원하지 않는 소셜 로그인입니다: ${provider}`);
  }
  let url = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${redirectUrl(provider)}&response_type=code`;
  if (config.scope) {
    url += `&scope=${config.scope}`;
  }
  return url;
};

export const startSocialLogin = (provider) => {
  window.location.href = buildSocialAuthUrl(provider);
};
