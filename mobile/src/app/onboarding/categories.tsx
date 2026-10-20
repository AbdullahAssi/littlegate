import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card, SwitchRow } from '@/components/Card';
import { IconCircle } from '@/components/IconCircle';
import { Screen } from '@/components/Screen';
import { Steps } from '@/components/Steps';
import { ServiceChips } from '@/components/ServiceChips';
import { Text } from '@/components/Text';
import { CATEGORIES, type CategoryId, useSettings } from '@/lib/kidMode';
import { parentSession } from '@/lib/parentSession';
import { CATEGORY_VISUAL } from '@/lib/visuals';
import { space } from '@/theme/tokens';
import { I } from '@/components/icons';

export default function Categories() {
  const [settings, update] = useSettings();

  // Changes filtering, so it needs the PIN like Settings (setup opens the session).
  if (!parentSession.isOpen()) return <Redirect href="/" />;

  function toggle(id: CategoryId, on: boolean) {
    if (!settings) return;
    const set = new Set(settings.categories);
    if (on) set.add(id);
    else set.delete(id);
    update({ categories: [...set] });
  }

  return (
    <Screen footer={<Button label="Finish setup" disabled={!settings} onPress={() => {
            parentSession.close();
            router.replace('/home');
          }} />}>
      <View style={styles.header}>
        <Steps at={3} />
        <Text variant="title">What should we block?</Text>
        <Text tone="secondary">The most important ones are already on. You can change this any time.</Text>
      </View>

      {settings ? (
        <>
          <Card style={styles.list}>
            {CATEGORIES.map((c, i) => (
              <SwitchRow
                key={c.id}
                title={c.title}
                detail={c.detail}
                icon={<IconCircle Icon={CATEGORY_VISUAL[c.id].Icon} />}
                value={settings.categories.includes(c.id)}
                onValueChange={(v) => toggle(c.id, v)}
              />
            ))}
          </Card>
          <Card style={{ gap: space.md }}>
            <View style={{ gap: 2 }}>
              <Text variant="heading">Block by name</Text>
              <Text variant="caption" tone="secondary">
                Just a few apps? Pick them here instead of a whole category.
              </Text>
            </View>
            <ServiceChips
              categories={settings.categories}
              blocked={settings.blockedServices}
              onChange={(blockedServices) => update({ blockedServices })}
            />
          </Card>
          <Card style={styles.list}>
            <SwitchRow
              icon={<IconCircle Icon={I.search} />}
              title="Safe search"
              detail="Google, Bing and YouTube show family-friendly results"
              value={settings.safeSearch}
              onValueChange={(v) => update({ safeSearch: v })}
            />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm, marginTop: space.lg },
  list: { paddingVertical: space.xs },
});
