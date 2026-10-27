import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { MessageView } from '../../../components/MessageView';
import { IconButton } from '../../../components/ui';

export default function MessageScreen() {
  const { account, id } = useLocalSearchParams<{ account: string; id: string }>();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <IconButton icon="back" label="Back to inbox" onPress={back} />
      </View>
      <MessageView accountId={account} id={id} onDone={back} />
    </SafeAreaView>
  );
}
