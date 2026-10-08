import React from 'react';
import { Image, Platform, Text, View } from 'react-native';
import type { PaymentMethod } from '../data/paymentMethods';
import { withAlpha } from '../theme';

/**
 * Method badge tile. Renders the real logo image when one's set (`method.logo`), otherwise
 * falls back to a bold letter-monogram tile (see the comment in data/paymentMethods.ts).
 * Sized and shadowed like a proper app icon rather than a thin outline glyph.
 */
export function PaymentBadge({ method, size = 40 }: { method: PaymentMethod; size?: number }) {
  const fontSize = method.mono.length <= 1 ? size * 0.46 : method.mono.length === 2 ? size * 0.34 : size * 0.22;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: method.color,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderTopWidth: 1,
        borderColor: withAlpha('#FFFFFF', 0.25),
        ...Platform.select({
          ios: { shadowColor: method.color, shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
          android: { elevation: 3 },
        }),
      }}
    >
      {method.logo ? (
        <Image
          source={method.logo}
          style={{ width: size * (method.logoFill ?? 0.72), height: size * (method.logoFill ?? 0.72) }}
          resizeMode="contain"
        />
      ) : (
        <Text style={{ fontSize, fontWeight: '800', color: '#FFFFFF', letterSpacing: method.mono.length > 2 ? 0.3 : 0 }}>
          {method.mono}
        </Text>
      )}
    </View>
  );
}
