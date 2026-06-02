# Bazar El Chunky ERP

App web tipo ERP para ventas diarias, apartados, abonos, gastos, nóminas, cargas e inventario pasivo.

## Instalar
```bash
npm install
cp .env.example .env
npm run dev
```

## Firebase
1. Crea un proyecto en Firebase.
2. Activa Firestore Database.
3. Activa Authentication con Email/Password si usarás login después.
4. Copia la configuración web en `.env`.

## Importante
La pantalla de inventario queda pasiva/no obligatoria porque el negocio maneja muchos artículos mezclados por carga.

## Modo demo sin Firebase
Si no llenas `.env`, la app usa `localStorage` para que puedas probar ventas, gastos, apartados, clientes y nóminas sin configurar Firebase.
