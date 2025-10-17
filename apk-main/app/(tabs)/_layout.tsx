import { Tabs } from 'expo-router';
import { Activity } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#2563eb',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Estaciones IoT',
          tabBarIcon: ({ size, color }) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
