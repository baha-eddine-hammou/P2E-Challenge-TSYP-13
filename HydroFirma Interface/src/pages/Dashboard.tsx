import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import SensorCard from '@/components/dashboard/SensorCard';
import PlantStatusCard from '@/components/dashboard/PlantStatusCard';
import SensorChart from '@/components/dashboard/SensorChart';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import { Thermometer, Droplets, Beaker, Sun, Wind, Gauge } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const [sensorData, setSensorData] = useState({
    temperature: 24.5,
    humidity: 68,
    ph: 6.2,
    ec: 1.8,
    light: 850,
    waterLevel: 78,
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData((prev) => ({
        temperature: +(prev.temperature + (Math.random() - 0.5) * 0.5).toFixed(1),
        humidity: Math.min(100, Math.max(40, prev.humidity + (Math.random() - 0.5) * 2)),
        ph: +(prev.ph + (Math.random() - 0.5) * 0.1).toFixed(1),
        ec: +(prev.ec + (Math.random() - 0.5) * 0.1).toFixed(1),
        light: Math.round(prev.light + (Math.random() - 0.5) * 50),
        waterLevel: Math.min(100, Math.max(20, prev.waterLevel + (Math.random() - 0.5) * 2)),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  const getTemperatureStatus = (): 'normal' | 'warning' | 'critical' => {
    if (sensorData.temperature > 28) return 'warning';
    return 'normal';
  };

  const getPhStatus = (): 'normal' | 'warning' | 'critical' => {
    if (sensorData.ph < 5.5 || sensorData.ph > 7) return 'warning';
    return 'normal';
  };

  const getWaterStatus = (): 'normal' | 'warning' | 'critical' => {
    if (sensorData.waterLevel < 30) return 'critical';
    return 'normal';
  };

  const sensors: Array<{
    title: string;
    value: number;
    unit: string;
    icon: React.ReactNode;
    status: 'normal' | 'warning' | 'critical';
    trend?: { value: number; isPositive: boolean };
    color: string;
  }> = [
      {
        title: 'Temperature',
        value: sensorData.temperature,
        unit: '°C',
        icon: <Thermometer className="w-6 h-6 text-primary-foreground" />,
        status: getTemperatureStatus(),
        trend: { value: 2.3, isPositive: true },
        color: 'bg-gradient-to-br from-hydro-amber to-hydro-amber-light',
      },
      {
        title: 'Humidity',
        value: Math.round(sensorData.humidity),
        unit: '%',
        icon: <Droplets className="w-6 h-6 text-primary-foreground" />,
        status: 'normal',
        trend: { value: 1.2, isPositive: false },
        color: 'bg-gradient-to-br from-hydro-ocean to-hydro-teal',
      },
      {
        title: 'pH Level',
        value: sensorData.ph,
        unit: '',
        icon: <Beaker className="w-6 h-6 text-primary-foreground" />,
        status: getPhStatus(),
        color: 'bg-gradient-to-br from-hydro-emerald to-hydro-teal',
      },
      {
        title: 'EC Level',
        value: sensorData.ec,
        unit: 'mS/cm',
        icon: <Gauge className="w-6 h-6 text-primary-foreground" />,
        status: 'normal',
        color: 'bg-gradient-to-br from-hydro-teal to-hydro-emerald-light',
      },
      {
        title: 'Light Intensity',
        value: sensorData.light,
        unit: 'lux',
        icon: <Sun className="w-6 h-6 text-primary-foreground" />,
        status: 'normal',
        color: 'bg-gradient-to-br from-hydro-amber-light to-hydro-amber',
      },
      {
        title: 'Water Level',
        value: Math.round(sensorData.waterLevel),
        unit: '%',
        icon: <Wind className="w-6 h-6 text-primary-foreground" />,
        status: getWaterStatus(),
        color: 'bg-gradient-to-br from-hydro-teal-light to-hydro-ocean',
      },
    ];

  const plants = [
    {
      id: '1',
      name: 'Tomato Cluster A',
      type: 'Cherry Tomatoes',
      health: 92,
      stage: 'Flowering',
      daysToHarvest: 14,
      lastWatered: '2 hours ago',
    },
    {
      id: '2',
      name: 'Lettuce Bed B',
      type: 'Butterhead Lettuce',
      health: 88,
      stage: 'Vegetative',
      daysToHarvest: 7,
      lastWatered: '1 hour ago',
    },
    {
      id: '3',
      name: 'Pepper Row C',
      type: 'Bell Peppers',
      health: 75,
      stage: 'Fruiting',
      daysToHarvest: 21,
      lastWatered: '3 hours ago',
    },
    {
      id: '4',
      name: 'Herb Garden D',
      type: 'Mixed Herbs',
      health: 95,
      stage: 'Harvest Ready',
      daysToHarvest: 0,
      lastWatered: '30 mins ago',
    },
  ];

  const temperatureHistory = Array.from({ length: 12 }, (_, i) => ({
    time: `${8 + i}:00`,
    value: 22 + Math.random() * 6,
  }));

  const phHistory = Array.from({ length: 12 }, (_, i) => ({
    time: `${8 + i}:00`,
    value: 5.8 + Math.random() * 1.4,
  }));

  const alerts = [
    {
      id: '1',
      type: 'warning' as const,
      title: 'High Temperature Alert',
      message: 'Greenhouse B temperature exceeded 28°C for 30 minutes.',
      time: '15 minutes ago',
    },
    {
      id: '2',
      type: 'success' as const,
      title: 'Harvest Ready',
      message: 'Herb Garden D is ready for harvesting.',
      time: '1 hour ago',
    },
    {
      id: '3',
      type: 'info' as const,
      title: 'Nutrient Refill Scheduled',
      message: 'Automatic nutrient solution refill scheduled for tomorrow.',
      time: '2 hours ago',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onLogout={handleLogout} />

      <main className="pt-20 pb-12 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Welcome back, <span className="hydro-gradient-text">{currentUser?.displayName || 'User'}</span>
            </h1>
            <p className="text-muted-foreground">
              Here's an overview of your hydroponic systems.
            </p>
          </div>

          {/* Sensor Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            {sensors.map((sensor, index) => (
              <SensorCard key={index} {...sensor} />
            ))}
          </div>

          {/* Charts and Alerts */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <SensorChart
              title="Temperature (24h)"
              data={temperatureHistory}
              color="hsl(38, 92%, 50%)"
              unit="°C"
            />
            <SensorChart
              title="pH Level (24h)"
              data={phHistory}
              color="hsl(158, 64%, 32%)"
              unit=""
            />
            <AlertsPanel alerts={alerts} />
          </div>

          {/* Plant Status */}
          <div className="mb-8">
            <h2 className="font-display text-xl font-semibold text-foreground mb-6">
              Plant Status
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plants.map((plant) => (
                <PlantStatusCard key={plant.id} plant={plant} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
