# 📊 Estadísticas - Descripción de la Feature

## ¿Qué se agregó?

Se implementó un sistema de estadísticas en tiempo real inspirado en **mibarrio.ar**. Los usuarios ahora pueden ver:
- **Esta semana**: Posts publicados en los últimos 7 días
- **Total histórico**: Posts totales desde que comenzó la app

---

## 🔧 CAMBIOS EN BACKEND (`api_db_final.js`)

### Nueva Función: `obtenerEstadisticas()`

```javascript
async function obtenerEstadisticas() {
    // Query 1: Posts últimos 7 días
    const weekResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM posts
        WHERE created_at >= NOW() - INTERVAL '7 days'
        AND is_visible = true
    `);
    
    // Query 2: Total histórico
    const totalResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM posts
        WHERE is_visible = true
    `);
    
    return {
        success: true,
        weeklyCount: parseInt(weekResult.rows[0].count),
        totalCount: parseInt(totalResult.rows[0].count)
    };
}
```

### Nueva Ruta: `GET_STATS` (Acción Pública)

```javascript
if (action === 'GET_STATS') {
    const resultado = await obtenerEstadisticas();
    return res.status(200).json(resultado);
}
```

**Características**:
- ✅ No requiere autenticación (es pública)
- ✅ Solo cuenta posts visibles (`is_visible = true`)
- ✅ Retorna JSON simple: `{ success: true, weeklyCount: 12, totalCount: 156 }`

---

## 🎨 CAMBIOS EN FRONTEND (`index_final.html`)

### 1. HTML: Barra de Estadísticas Pública

```html
<!-- Aparece después del header, antes de los filtros -->
<div class="stats-bar" id="statsBar" style="display: none;">
    <div class="stat-item">
        <span>📊 Esta semana:</span>
        <span class="stat-value" id="weeklyCount">0</span>
    </div>
    <div class="stat-item" style="border-left: 1px solid #e2e8f0; padding-left: 15px;">
        <span>📈 Total:</span>
        <span class="stat-value" id="totalCount">0</span>
    </div>
</div>
```

**Visibilidad**: Solo aparece para usuarios logueados

### 2. CSS: Estilos Glassmorphism

```css
/* Estadísticas */
.stats-bar {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 12px 20px;
    display: flex;
    justify-content: center;
    gap: 15px;
    flex-wrap: wrap;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: var(--text-muted);
}

.stat-value {
    font-weight: 700;
    color: var(--primary);        /* Azul primario */
    font-size: 1.1rem;
}
```

### 3. JavaScript: Funciones de Carga

#### Función: `loadStats()`
```javascript
async function loadStats() {
    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'GET_STATS' })
        });
        const data = await response.json();
        if (data.success) {
            document.getElementById('weeklyCount').textContent = data.weeklyCount || 0;
            document.getElementById('totalCount').textContent = data.totalCount || 0;
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}
```

**Cuándo se llama**:
- Al cargar la app (`init()`)
- Automáticamente cada 30 segundos (interval)

#### Función: `actualizarEstadisticasAdmin()`
```javascript
async function actualizarEstadisticasAdmin() {
    // Llamar con token JWT
    const response = await fetch(CONFIG.apiUrl, {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'GET_STATS' })
    });
    // Actualizar elementos: #adminWeeklyStats, #adminTotalStats
}
```

**Cuándo se llama**:
- Al entrar al panel admin (`goToAdmin()`)

### 4. Panel Admin: Bloque de Estadísticas

```html
<div class="glass-card" style="margin-bottom: 1.5rem;">
    <h3 style="margin-bottom: 1rem;">📊 Estadísticas</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <!-- Card 1: Esta semana -->
        <div style="padding: 1rem; background: #f0f9ff; border-radius: 10px; border-left: 4px solid var(--primary);">
            <div style="font-size: 0.85rem; color: var(--text-muted);">Posts esta semana</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);" id="adminWeeklyStats">0</div>
        </div>
        
        <!-- Card 2: Total histórico -->
        <div style="padding: 1rem; background: #f0fdf4; border-radius: 10px; border-left: 4px solid #10b981;">
            <div style="font-size: 0.85rem; color: var(--text-muted);">Total histórico</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;" id="adminTotalStats">0</div>
        </div>
    </div>
</div>
```

**Ubicación**: Arriba de la tabla de posts en el panel admin

---

## 📱 FLUJO DE DATOS

```
Frontend (index_final.html)
    ↓
    llamarAPI('GET_STATS')
    ↓
Backend (/api/db)
    ↓
    obtenerEstadisticas()
    ↓
Neon PostgreSQL
    ↓
    SELECT COUNT(*) WHERE created_at >= NOW() - INTERVAL '7 days'
    SELECT COUNT(*) FROM posts
    ↓
Backend (retorna JSON)
    ↓
Frontend (actualiza spans)
```

---

## 🔄 SINCRONIZACIÓN EN TIEMPO REAL

### Actualización Automática Pública

```javascript
// En setupEventListeners()
setInterval(loadStats, 30000); // Cada 30 segundos
```

**Resultado**: Los contadores se actualizan automáticamente sin que el usuario tenga que recargar

### Actualización en Panel Admin

Se actualiza automáticamente al abrir el panel (`goToAdmin()`)

---

## ✅ TESTING

### Test 1: Estadísticas Públicas
```
1. Abre la app logueado
2. Verifica que aparece la barra "📊 Esta semana: X | 📈 Total: Y"
3. Espera 30 segundos
4. Verifica que los números se actualizaron (si hay nuevos posts)
```

### Test 2: Estadísticas Admin
```
1. Logueado como admin, presiona panel admin (botón 🛡️)
2. Verifica que aparecen 2 cajas: "Posts esta semana" y "Total histórico"
3. Compara con los números de la barra pública (deben ser iguales)
```

### Test 3: Consultas SQL
```
En Neon SQL Editor:
SELECT COUNT(*) FROM posts 
WHERE created_at >= NOW() - INTERVAL '7 days' AND is_visible = true;

SELECT COUNT(*) FROM posts WHERE is_visible = true;
```

---

## 🔒 SEGURIDAD

- ✅ `GET_STATS` es público (no requiere auth)
- ✅ Solo cuenta posts `is_visible = true` (posts ocultos no se muestran)
- ✅ La query usa timestamps de PostgreSQL (no confía en cliente)
- ✅ No expone datos sensibles (solo conteos)

---

## 📊 ANALOGÍA CON mibarrio.ar

En **mibarrio.ar** ves:
- "📊 Avisos esta semana: 24"
- "📈 Total avisos: 1,235"

En **Rodríguez Conecta** ahora ves exactamente lo mismo:
- Barra pública para todos (logueados)
- Estadísticas detalladas en panel admin
- Actualizaciones en tiempo real cada 30 segundos

---

## 🚀 DEPLOYMENT

No requiere cambios en deployment. Solo asegúrate de que:

1. `api_db_final.js` tiene la función `obtenerEstadisticas()`
2. `index_final.html` tiene las funciones `loadStats()` y `actualizarEstadisticasAdmin()`
3. Database URL está correcta en variables de entorno

---

## 📝 PRÓXIMAS MEJORAS (Futuro)

- [ ] Gráfico de tendencias (línea con posts/día)
- [ ] Estadísticas por categoría (cuántos en cada categoría)
- [ ] Top usuarios (más posts publicados)
- [ ] Actividad en tiempo real (feed de nuevos posts)
- [ ] Exportar estadísticas a CSV (admin)

---

**Feature Status**: ✅ Completado y probado
**Última actualización**: 2024
