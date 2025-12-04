# 🎯 Constants Usage Guide

## Payment Constants

### Importazione
```javascript
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, CLIENT_STATUS } from '../../constants/payments';
```

### Uso
```javascript
// ❌ PRIMA (hardcoded)
if (payment.method === 'bonifico') { }

// ✅ DOPO (constants)
if (payment.method === PAYMENT_METHODS.BONIFICO) { }

// Labels automatiche
<option value={PAYMENT_METHODS.BONIFICO}>
  {PAYMENT_METHOD_LABELS[PAYMENT_METHODS.BONIFICO]}
</option>

// Iterate sui metodi
Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
  <option key={key} value={key}>{label}</option>
))
```

## App Constants

```javascript
import { TIME_RANGES, USER_ROLES, ACTIVITY_TYPES } from '../../constants';

// Time ranges
timeRange === TIME_RANGES.MONTH

// Roles
userRole === USER_ROLES.ADMIN

// Activity types
activity.type === ACTIVITY_TYPES.RENEWAL
```

## Benefici

✅ **Zero typo**: L'IDE ti avverte se scrivi male
✅ **Refactoring safe**: Cambi in un posto solo
✅ **Autocomplete**: IDE suggerisce i valori
✅ **Type safety ready**: Facile passare a TypeScript
✅ **Manutenzione**: Valori centralizzati
