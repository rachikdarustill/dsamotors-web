<script setup lang="ts">
const route = useRoute();
const q = ref(String(route.query.q || ''));
const { get } = useApi();

const { data: products, refresh, pending } = await useAsyncData(
  'products-catalog',
  () => get<any[]>('/products', q.value ? { q: q.value } : undefined),
);

watch(q, async (value) => {
  await navigateTo({ query: value ? { q: value } : {} }, { replace: true });
  await refresh();
});
</script>

<template>
  <main class="catalog">
    <div class="container">
      <div class="searchbar">
        <input v-model="q" placeholder="VIN, OEM, название детали">
      </div>
      <div v-if="pending" class="panel">Загрузка каталога…</div>
      <div v-else class="grid">
        <ProductCard v-for="product in products || []" :key="product.id" :product="product" />
      </div>
    </div>
  </main>
</template>
