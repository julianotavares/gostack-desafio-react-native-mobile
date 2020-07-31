import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  category: string;
  thumbnail_url: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [totalPrice, setTotalPrice] = useState(0);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [idFavorite, setIdFavorite] = useState(0);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  const loodFavorite = useCallback(async (id: number) => {
    const favoriteFood = await api.get(`/favorites`, {
      params: {
        product_id: id,
      },
    });

    if (!favoriteFood.data[0]) {
      return;
    }

    setIdFavorite(favoriteFood.data[0].id);

    setIsFavorite(!!favoriteFood.data[0].id);
  }, []);

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const { data } = await api.get<Food>(`/foods/${routeParams.id}`);

      const foodFormatted = {
        ...data,
        formattedPrice: formatValue(data.price),
      };

      const extraFormatted = data.extras.map(extra => ({
        ...extra,
        quantity: 0,
      }));

      setFood(foodFormatted);

      setExtras(extraFormatted);

      loodFavorite(data.id);
    }

    loadFood();
  }, [routeParams, loodFavorite]);

  const handleIncrementExtra = useCallback(
    (id: number) => {
      const addExtras = extras.map(extra => {
        if (extra.id === id) {
          const addExtra = { ...extra };
          addExtra.quantity += 1;
          return addExtra;
        }
        return extra;
      });

      setExtras(addExtras);
    },
    [extras],
  );

  const handleDecrementExtra = useCallback(
    (id: number) => {
      const addExtras = extras.map(extra => {
        if (extra.id === id) {
          const addExtra = { ...extra };

          if (addExtra.quantity > 0) {
            addExtra.quantity -= 1;
          }

          return addExtra;
        }
        return extra;
      });

      setExtras(addExtras);
    },
    [extras],
  );

  const handleIncrementFood = useCallback(() => {
    setFoodQuantity(foodQuantity + 1);
  }, [foodQuantity]);

  const handleDecrementFood = useCallback(() => {
    if (foodQuantity > 1) {
      setFoodQuantity(foodQuantity - 1);
    }
  }, [foodQuantity]);

  const saveFavorite = useCallback(async () => {
    const dataFavorite = {
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: food.price,
      category: food.category,
      image_url: food.image_url,
      thumbnail_url: food.thumbnail_url,
    };

    await api.post('favorites', dataFavorite);
  }, [food]);

  const deleteFavorite = useCallback(async () => {
    await api.delete(`favorites/${idFavorite}`);
  }, [idFavorite]);

  const toggleFavorite = useCallback(async () => {
    if (!isFavorite) {
      saveFavorite();
    } else {
      deleteFavorite();
    }

    setIsFavorite(!isFavorite);
  }, [isFavorite, saveFavorite, deleteFavorite]);

  const cartTotal = useMemo(() => {
    const calcTotalPrice =
      food.price * foodQuantity +
      extras.reduce(
        (totalExtras, extra) => totalExtras + extra.quantity * extra.value,
        0.0,
      );

    setTotalPrice(calcTotalPrice);

    return formatValue(calcTotalPrice);
  }, [extras, food, foodQuantity]);

  const handleFinishOrder = useCallback(async () => {
    const productAdd = {
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: totalPrice,
      category: food.category,
      thumbnail_url: food.thumbnail_url,
      quantity: foodQuantity,
      extras: food.extras,
    };

    await api.post('orders', productAdd);

    navigation.navigate('Orders');
  }, [food, foodQuantity, totalPrice, navigation]);

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
