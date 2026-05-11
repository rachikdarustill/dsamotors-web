<script setup lang="ts">
const q = ref('');
const { get } = useApi();

const { data: products, refresh, pending } = await useAsyncData(
  'products-home',
  () => get<any[]>('/products', q.value ? { q: q.value } : undefined),
);

watch(q, async () => {
  await refresh();
});
</script>

<template>
  <main>
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-card">
          <h1>DSA Motors</h1>
          <p>
            Оригинальные автозапчасти из Японии.
          </p>
        </div>
        <div class="stats">
          <div class="panel">
            <strong>Доставка</strong>
            <p class="note">...</p>
          </div>
          <div class="panel">
            <strong>Оплата</strong>
            <p class="note">...</p>
          </div>
        </div>
      </div>
    </section>

    <section class="catalog">
      <div class="container">
        <div class="searchbar">
          <input v-model="q" placeholder="Поиск по названию, OEM, бренду">
          <NuxtLink class="btn" to="/catalog">Весь каталог</NuxtLink>
        </div>

        <div v-if="pending" class="panel">Загрузка товаров…</div>
        <div v-else class="grid">
          <ProductCard v-for="product in products || []" :key="product.id" :product="product" />
        </div>
      </div>
    </section>
  </main>
</template>
