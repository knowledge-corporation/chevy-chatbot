import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, Text, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { HeaderBackButton } from "@react-navigation/stack";
import { AdMobInterstitial, setTestDeviceIDAsync } from "expo-ads-admob";

import AsyncStorage from "@react-native-async-storage/async-storage";

import Dialog from "../../../components/Dialog";
import imageDefalt from "../../../assets/not_found.png";

import api from "../../../services/api";

export default function EvaluateDialogues() {
  const limit = 20;
  const [dialogs, setDialogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  async function filterDialogs(response) {
    const userId = await AsyncStorage.getItem("userId");
    const filterData = response.data.data.filter((dialog) => {
      return !(
        dialog.approvals.includes(userId) ||
        dialog.disapprovals.includes(userId) ||
        dialog.owner === userId
      );
    });
    return filterData;
  }

  const loadData = async () => {
    if (loading) {
      return;
    }

    if (total > 0 && page > Math.ceil(total / limit)) {
      return;
    }

    setLoading(true);

    const response = await api.get("/v1/dialog", {
      headers: { page, limit },
    });

    const filterData = await filterDialogs(response);

    setDialogs([...dialogs, ...filterData]);
    setTotal(response.headers["x-total-count"]);
    setPage(page + 1);
    setLoading(false);
  };

  const showInterstitial = async () => {
    navigation.navigate("Manage Dialogues");
    await AdMobInterstitial.setAdUnitID(
      "ca-app-pub-4790228310824010/8705679279"
      //"ca-app-pub-3940256099942544/1033173712"
    );
    await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
    await AdMobInterstitial.showAdAsync();
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderBackButton onPress={showInterstitial} title="Update count" />
      ),
    });
  }, [navigation]);

  const setTestDevice = async () => await setTestDeviceIDAsync("EMULATOR");

  useEffect(() => {
    setTestDevice();
    loadData();
  }, []);

  return (
    <View>
      {dialogs.length > 0 ? (
        <FlatList
          data={dialogs}
          showsVerticalScrollIndicator={false}
          onEndReached={loadData}
          onEndReachedThreshold={0.2}
          renderItem={({ item }) => (
            <Dialog
              dialogId={item.id}
              speech={item.speech}
              answer={item.answer}
              createdAt={item.createdAt}
              isEvaluation
              editable={false}
            />
          )}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <View style={styles.viewDefault}>
          <Image style={styles.imageDefault} source={imageDefalt} />
          <Text style={styles.textDefault}>
            No records found, please try again later
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  viewDefault: {
    justifyContent: "center",
    alignItems: "center",
  },
  imageDefault: {
    resizeMode: "contain",
    borderRadius: 30,
    width: 300,
    height: 600,
  },
  textDefault: {
    fontSize: 18,
    color: "grey",
  },
});
