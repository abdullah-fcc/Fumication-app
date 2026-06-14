import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import JobsScreen from '../screens/JobsScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import ReportScreen from '../screens/ReportScreen';

export type RootStackParamList = {
  Jobs: undefined;
  JobDetail: { jobId: string };
  Report: { jobId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Jobs">
        <Stack.Screen name="Jobs" component={JobsScreen} options={{ title: 'My Jobs' }} />
        <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Details' }} />
        <Stack.Screen name="Report" component={ReportScreen} options={{ title: 'Service Report' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
