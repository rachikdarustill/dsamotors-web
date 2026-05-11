<script setup lang="ts">
defineProps<{
  product: {
    id: string;
    title: string;
    category: string;
    make: string;
    price: number;
    oem: string;
    images: string[];
  };
}>();

const formatRub = (value: number) =>
  `${Math.round(value || 0).toLocaleString('ru-RU')} ₽`;
</script>

<template>
  <NuxtLink :to="`/product/${product.id}`" class="card">
    <img
      class="product-image"
      :src="product.images[0] || '/no-image.svg'"
      :alt="product.title"
    >
    <div class="card-body">
      <div class="pill">{{ product.category || 'Запчасть' }}</div>
      <h3>{{ product.title }}</h3>
      <div class="price">{{ formatRub(product.price) }}</div>
      <p class="note">OEM: {{ product.oem || '—' }}</p>
      <p class="note">Бренд авто: {{ product.make || '—' }}</p>
    </div>
  </NuxtLink>
</template>
