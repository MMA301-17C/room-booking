import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { formatCurrency } from 'react-native-format-currency';
import { Card, Button, Appbar, Divider } from 'react-native-paper';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../utils/firebase';

const HomeScreen = ({ navigation, token, setToken }) => {
	const [location, setLocation] = useState(null);
	const [roomsData, setRoomsData] = useState([]);

	useEffect(() => {
		(async () => {
			let { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert('Quyền truy cập vị trí bị từ chối');
				return;
			}

			let currentLocation = await Location.getCurrentPositionAsync({});
			setLocation(currentLocation.coords);
		})();
	}, []);

	useEffect(() => {
		const db = getDatabase(app);
		const roomsRef = ref(db, 'rooms/');

		onValue(roomsRef, (snapshot) => {
			const data = snapshot.val();
			if (data) {
				const roomsArray = Object.keys(data).map((key) => ({
					id: key,
					...data[key],
				}));
				setRoomsData(roomsArray);
			}
		});
	}, []);

	const handleLogout = () => {
		Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất không?', [
			{ text: 'Hủy', style: 'cancel' },
			{
				text: 'Đăng xuất',
				onPress: () => {
					setToken(null);
					navigation.navigate('LoginScreen');
				},
			},
		]);
	};

	const renderRoom = ({ item }) => {
		const [pricePerNight] = formatCurrency({
			amount: item.pricePerNight,
			code: 'VND',
		});

		return (
			<Card style={styles.card}>
				<Image source={{ uri: item.imageURL }} style={styles.image} />
				<View style={styles.infoContainer}>
					<Text style={styles.title}>{item.title}</Text>
					<Text style={styles.description}>{item.description}</Text>
					<Text style={styles.price}>{pricePerNight} / đêm</Text>
					<Text style={styles.amenities}>{item.amenities.join(' • ')}</Text>
					<Button
						mode="contained"
						style={styles.button}
						onPress={() =>
							navigation.navigate('RoomDetailScreen', {
								roomId: item.id,
								userId: token,
							})
						}
					>
						Xem Chi Tiết
					</Button>
				</View>
			</Card>
		);
	};

	return (
		<View style={styles.container}>
			<Appbar.Header>
				<Appbar.Content title="Đặt Phòng" />
				<Appbar.Action
					icon="history"
					onPress={() =>
						navigation.navigate('HistoryBooking', { userId: token })
					}
				/>
				<Appbar.Action icon="logout" onPress={handleLogout} />
			</Appbar.Header>

			<Text style={styles.sectionTitle}>Vị trí hiện tại của bạn</Text>
			{location ? (
				<MapView
					style={styles.map}
					initialRegion={{
						latitude: location.latitude,
						longitude: location.longitude,
						latitudeDelta: 0.05,
						longitudeDelta: 0.05,
					}}
				>
					<Marker
						coordinate={{
							latitude: location.latitude,
							longitude: location.longitude,
						}}
						title="Vị trí của bạn"
					/>
				</MapView>
			) : (
				<Text style={styles.loadingText}>Đang xác định vị trí...</Text>
			)}

			<Divider style={styles.divider} />

			<Text style={styles.sectionTitle}>Danh sách phòng hiện có</Text>
			<FlatList
				data={roomsData}
				renderItem={renderRoom}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.list}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333',
		marginLeft: 15,
		marginVertical: 10,
	},
	map: {
		width: '100%',
		height: 180,
		borderRadius: 15,
		marginVertical: 10,
	},
	divider: {
		height: 1,
		backgroundColor: '#DADADA',
		marginVertical: 10,
		marginHorizontal: 15,
	},
	list: {
		paddingHorizontal: 10,
		paddingBottom: 20,
	},
	card: {
		borderRadius: 10,
		overflow: 'hidden',
		marginBottom: 15,
		backgroundColor: '#fff',
		elevation: 3,
	},
	image: {
		width: '100%',
		height: 180,
	},
	infoContainer: {
		padding: 15,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
	},
	description: {
		fontSize: 14,
		color: '#757575',
		marginVertical: 5,
	},
	price: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#FF5A5F',
		marginVertical: 8,
	},
	amenities: {
		fontSize: 12,
		color: '#757575',
		marginBottom: 15,
	},
	button: {
		alignSelf: 'flex-start',
		backgroundColor: '#FF5A5F',
	},
	loadingText: {
		textAlign: 'center',
		marginVertical: 10,
		color: '#757575',
	},
});

export default HomeScreen;
