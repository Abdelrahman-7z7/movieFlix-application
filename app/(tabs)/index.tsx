import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { Image, ScrollView, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 bg-primary">
      <Image source={images.bg} className="w-full absolute z-0"/>

      {/* applying "scrollView" which make the whole screen scrollable */}
      <ScrollView className="flex-1 px-5" 
        showsVerticalScrollIndicator={false}  //hides the scrol bar
        contentContainerStyle={{ //define the scroll high of the whole page
        minHeight: "100%", paddingBottom: 10
      }}>
        <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto"/>
      </ScrollView>
    </View>
  );
}
