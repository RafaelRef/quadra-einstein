// Quadra Einstein — i18n mínimo: dicionário + idioma persistido por dispositivo.
//
// Cobertura hoje: login (index.html) e escolha de time (choose.html) — as duas
// telas que qualquer pessoa nova vê primeiro. Estender pro resto do app é
// mecânico, não arquitetural: acrescente a chave nos dois dicionários abaixo e
// marque o elemento com `data-i18n="chave"` (texto) ou
// `data-i18n-placeholder="chave"` (placeholder de input), depois chame
// `applyTranslations()`. Campos que viram DADO salvo no banco (ex.: posição da
// atleta) ficam de fora de propósito — traduzir só o rótulo sem traduzir o
// valor gravado exigiria migrar esses valores pra um código independente de
// idioma, o que é uma mudança de modelo de dados, não deste mecanismo de UI.

const DICTS = {
  'pt-BR': {
    'login.tagline': 'Basquete universitário com dados',
    'login.tab_login': 'Entrar',
    'login.tab_signup': 'Cadastrar',
    'login.email_label': 'E-mail',
    'login.password_label': 'Senha',
    'login.confirm_password_label': 'Confirmar senha',
    'login.password_placeholder': 'mínimo 6 caracteres',
    'login.submit': 'Entrar',
    'login.signup_submit': 'Criar conta',
    'login.error_invalid': 'E-mail ou senha incorretos.',
    'login.error_mismatch': 'As senhas não coincidem.',
    'login.error_generic': 'Erro ao criar conta.',
    'login.success_created': 'Conta criada! Verifique seu e-mail para confirmar.',
    'footer.text': 'Quadra Einstein © 2026 — NDU & JUBS',
    'choose.hi': 'Olá',
    'choose.subtitle': 'O que você quer fazer hoje?',
    'choose.myteam_title': 'Meu Time',
    'choose.myteam_loading': 'Carregando...',
    'choose.myteam_desc': 'Elenco, jogos, estatísticas e evolução do seu time.',
    'choose.explore_title': 'Explorar',
    'choose.explore_desc': 'Classificação e estatísticas de outros times no NDU e JUBS.',
    'choose.logout': 'Sair',
    'onboarding.title': 'Bem-vindo(a) à Quadra Einstein! 👋',
    'onboarding.subtitle': 'Vamos criar seu time antes de começar.',
    'onboarding.step1_label': 'Passo 1 — Nome do time',
    'onboarding.team_placeholder': 'Ex: Medicina Einstein',
    'onboarding.step2_label': 'Passo 2 — Primeira atleta (opcional)',
    'onboarding.player_placeholder': 'Nome da atleta',
    'onboarding.create_button': 'Criar time',
    'onboarding.error_missing_name': 'Informe o nome do time.',
    'onboarding.error_generic': 'Erro ao criar time.',
  },
  'en': {
    'login.tagline': 'College basketball, backed by data',
    'login.tab_login': 'Log in',
    'login.tab_signup': 'Sign up',
    'login.email_label': 'Email',
    'login.password_label': 'Password',
    'login.confirm_password_label': 'Confirm password',
    'login.password_placeholder': 'minimum 6 characters',
    'login.submit': 'Log in',
    'login.signup_submit': 'Create account',
    'login.error_invalid': 'Incorrect email or password.',
    'login.error_mismatch': 'Passwords don’t match.',
    'login.error_generic': 'Error creating account.',
    'login.success_created': 'Account created! Check your email to confirm.',
    'footer.text': 'Quadra Einstein © 2026 — NDU & JUBS',
    'choose.hi': 'Hi',
    'choose.subtitle': 'What do you want to do today?',
    'choose.myteam_title': 'My Team',
    'choose.myteam_loading': 'Loading...',
    'choose.myteam_desc': 'Roster, games, stats and season trends for your team.',
    'choose.explore_title': 'Explore',
    'choose.explore_desc': 'Standings and stats for other teams in NDU and JUBS.',
    'choose.logout': 'Log out',
    'onboarding.title': 'Welcome to Quadra Einstein! 👋',
    'onboarding.subtitle': 'Let’s set up your team before you start.',
    'onboarding.step1_label': 'Step 1 — Team name',
    'onboarding.team_placeholder': 'E.g. Einstein Medicine',
    'onboarding.step2_label': 'Step 2 — First player (optional)',
    'onboarding.player_placeholder': 'Player name',
    'onboarding.create_button': 'Create team',
    'onboarding.error_missing_name': 'Enter your team name.',
    'onboarding.error_generic': 'Error creating team.',
  },
};

const STORAGE_KEY = 'qe_lang';

export function getLang() {
  return localStorage.getItem(STORAGE_KEY) || 'pt-BR';
}

export function setLang(lang) {
  localStorage.setItem(STORAGE_KEY, lang);
  applyTranslations();
}

export function t(key) {
  const dict = DICTS[getLang()] || DICTS['pt-BR'];
  return dict[key] ?? DICTS['pt-BR'][key] ?? key;
}

export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.documentElement.lang = getLang() === 'en' ? 'en' : 'pt-BR';
}

// Botão de troca 🌐 PT/EN — chame uma vez por página, com o elemento onde
// deve aparecer (normalmente dentro da .navbar-actions).
export function mountLangSwitch(container) {
  const btn = document.createElement('button');
  btn.className = 'btn btn-ghost btn-sm';
  btn.type = 'button';
  const render = () => { btn.textContent = getLang() === 'en' ? '🌐 EN' : '🌐 PT'; };
  render();
  btn.addEventListener('click', () => {
    setLang(getLang() === 'en' ? 'pt-BR' : 'en');
    render();
  });
  container.appendChild(btn);
}
