<script setup lang="ts">
const route = useRoute();
const { get, post } = useApi();

const email = ref('');
const phone = ref('');
const error = ref('');
const loading = ref(false);

const { data: product } = await useAsyncData(
  `product-${route.params.id}`,
  () => get<any>(`/products/${route.params.id}`),
);

const formatRub = (value: number) =>
  `${Math.round(value || 0).toLocaleString('ru-RU')} ₽`;

const pay = async () => {
  error.value = '';
  loading.value = true;

  try {
    const order = await post<any>('/orders', {
      productId: route.params.id,
      email: email.value || undefined,
      phone: phone.value || undefined,
    });

    if (order.paymentUrl) {
      await navigateTo(order.paymentUrl, { external: true });
      return;
    }

    error.value = 'Не удалось получить ссылку на оплату.';
  } catch (err: any) {
    error.value = err?.data?.message || 'Ошибка создания заказа.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="product-page">
    <div class="container" v-if="product">
      <div class="product-grid">
        <div class="panel">
          <img
            class="product-image"
            :src="product.images?.[0] || '/no-image.svg'"
            :alt="product.title"
          >
          <p class="note" style="margin-top: 14px;">{{ product.description }}</p>
        </div>

        <div class="panel">
          <div class="pill">{{ product.category || 'Запчасть' }}</div>
          <h1>{{ product.title }}</h1>
          <div class="price">{{ formatRub(product.price) }}</div>

          <div class="meta">
            <div class="meta-item">
              <strong>OEM</strong>
              <span>{{ product.oem || '—' }}</span>
            </div>
            <div class="meta-item">
              <strong>Состояние</strong>
              <span>{{ product.condition || '—' }}</span>
            </div>
            <div class="meta-item">
              <strong>Адрес</strong>
              <span>{{ product.address || '—' }}</span>
            </div>
            <div class="meta-item">
              <strong>Бренд авто</strong>
              <span>{{ product.make || '—' }}</span>
            </div>
          </div>

          <h3>Оплата онлайн</h3>
          <p class="note">
            Для отправки электронного чека по 54-ФЗ укажите email или телефон до оплаты.
          </p>

          <div class="field">
            <label for="email">Email</label>
            <input id="email" v-model="email" type="email" placeholder="buyer@example.com">
          </div>
          <div class="field">
            <label for="phone">Телефон</label>
            <input id="phone" v-model="phone" type="tel" placeholder="+7 900 000-00-00">
          </div>

          <div v-if="error" class="panel" style="margin: 12px 0; color: #b42318;">{{ error }}</div>

          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="btn primary" :disabled="loading" @click="pay">
              {{ loading ? 'Создаю ссылку…' : 'Оплатить через Точку' }}
            </button>
            <NuxtLink class="btn" to="/catalog">Назад в каталог</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
