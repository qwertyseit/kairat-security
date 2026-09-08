const CONTACT_METHODS = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  phone: 'Телефон'
};

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  }
});

const cleanText = (value, maxLength) => {
  if (typeof value !== 'string') return '';
  return value.replace(/[\r\n\t]+/g, ' ').trim().slice(0, maxLength);
};

const getPagePath = value => {
  const path = cleanText(value, 180);
  return path.startsWith('/') && !path.startsWith('//') ? path : '/';
};

export async function onRequestPost({ request, env }) {
  const requestUrl = new URL(request.url);
  const requestOrigin = request.headers.get('Origin');
  if (requestOrigin && requestOrigin !== requestUrl.origin) {
    return json({ ok: false, error: 'Заявка отправлена с недопустимого источника.' }, 403);
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Не удалось прочитать заявку. Попробуйте ещё раз.' }, 400);
  }

  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    return json({ ok: false, error: 'Некорректные данные заявки.' }, 400);
  }

  // Невидимое для посетителя поле: заполненный ботом запрос не отправляем в Telegram.
  if (cleanText(payload.website, 200)) return json({ ok: true });

  const name = cleanText(payload.name, 100);
  const phone = cleanText(payload.phone, 30);
  const email = cleanText(payload.email, 254).toLowerCase();
  const contactMethod = cleanText(payload.contactMethod, 20);

  if (name.length < 2) {
    return json({ ok: false, error: 'Укажите имя.' }, 400);
  }
  if (!CONTACT_METHODS[contactMethod]) {
    return json({ ok: false, error: 'Выберите удобный способ связи.' }, 400);
  }
  if (phone && (!/^[+()\d\s.-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7)) {
    return json({ ok: false, error: 'Введите корректный номер телефона.' }, 400);
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'Введите корректный email.' }, 400);
  }
  if ((contactMethod === 'whatsapp' || contactMethod === 'phone') && !phone) {
    return json({ ok: false, error: 'Укажите номер телефона для выбранного способа связи.' }, 400);
  }
  if (contactMethod === 'email' && !email) {
    return json({ ok: false, error: 'Укажите email для выбранного способа связи.' }, 400);
  }
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.error('Telegram environment variables are not configured.');
    return json({ ok: false, error: 'Сервис заявок временно недоступен. Попробуйте позже.' }, 503);
  }

  const page = new URL(getPagePath(payload.pagePath), requestUrl.origin).toString();
  const time = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Almaty'
  }).format(new Date());
  const message = [
    '🔔 Новая заявка с сайта Kairat Security',
    '',
    `Имя: ${name}`,
    `Телефон: ${phone || 'Не указан'}`,
    `Email: ${email || 'Не указан'}`,
    `Связаться через: ${CONTACT_METHODS[contactMethod]}`,
    `Страница: ${page}`,
    `Время: ${time}`
  ].join('\n');

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: message,
        disable_web_page_preview: true
      })
    });
    const telegramResult = await telegramResponse.json().catch(() => null);

    if (!telegramResponse.ok || !telegramResult?.ok) {
      console.error('Telegram did not accept the lead.', { status: telegramResponse.status });
      return json({ ok: false, error: 'Не удалось отправить заявку. Попробуйте ещё раз.' }, 502);
    }
  } catch {
    console.error('Telegram delivery request failed.');
    return json({ ok: false, error: 'Не удалось отправить заявку. Проверьте подключение и попробуйте ещё раз.' }, 502);
  }

  return json({ ok: true });
}
