import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Image, FlatList, Modal, TouchableOpacity, KeyboardAvoidingView, TextInput } from 'react-native';
import { Header, PrimaryButton, Input } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import { placeholder_image, checkCircleFill, checkCircle } from '../../assets'
import { SvgXml } from 'react-native-svg';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const SelectSpecies = ({ visible, closeSelectSpeciesModal, onPressSaveAndContinue, species }) => {

    const [isShowTreeCountModal, setIsShowTreeCountModal] = useState(false);
    const [treeCount, setTreeCount] = useState('');
    const [activeSpeice, setActiveSpecie] = useState(undefined);
    const [speciesList, setSpeciesList] = useState(speciesJSON)

    useEffect(() => {
        for (let i = 0; i < species.length; i++) {
            const oneSpecie = species[i];
            speciesList[oneSpecie.id].treeCount = oneSpecie.treeCount
        }
        setSpeciesList(speciesList)
        return () => {
            setSpeciesList([...speciesJSON])
        }
    }, [])

    const onPressSpecie = (index) => {
        if (speciesList[index].treeCount) {
            speciesList[index].treeCount = undefined;
            setTimeout(() => setSpeciesList([...speciesList]), 0)
        } else {
            setActiveSpecie(index)
            setIsShowTreeCountModal(true)
            setTimeout(() => { speciesList[index].treeCount ? setTreeCount(speciesList[index].treeCount) : null }, 0)
        }
    }

    const renderSpeciesCard = ({ item, index }) => {
        let isCheck = item.treeCount ? true : false;
        return (
            <TouchableOpacity onPress={() => onPressSpecie(index)} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 20 }}>
                <View>
                    <SvgXml xml={isCheck ? checkCircleFill : checkCircle} />
                </View>
                <Image source={placeholder_image} resizeMode={'contain'} style={{ flex: 1 }} />
                <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} style={styles.speciesName}>{item.nameOfTree}</Text>
                    {item.treeCount && <Text style={styles.treeCount}>{`${item.treeCount} Trees`}</Text>}
                </View>
            </TouchableOpacity>)
    }

    const onPressTreeCountNextBtn = () => {
        let speciesListClone = speciesList;
        let specie = speciesListClone[activeSpeice]
        specie.treeCount = Number(treeCount) ? treeCount : undefined;
        speciesListClone.splice(activeSpeice, 1, specie)
        setIsShowTreeCountModal(false)
        setTreeCount(0)
        setSpeciesList([...speciesJSON])
    }

    const renderTreeCountModal = () => {
        let specieName = isShowTreeCountModal ? speciesList[activeSpeice].nameOfTree : '';
        return (
            <Modal visible={isShowTreeCountModal} transparent={true}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ backgroundColor: Colors.WHITE, marginVertical: 30, marginHorizontal: 20, borderRadius: 20, padding: 20, width: '80%' }}>
                        <Image source={placeholder_image} style={{ alignSelf: 'center', marginVertical: 20 }} />
                        <Header hideBackIcon subHeadingText={'How many'} textAlignStyle={{ textAlign: 'center' }} />
                        <Header hideBackIcon subHeadingText={specieName} textAlignStyle={{ textAlign: 'center', fontStyle: 'italic', }} />
                        <Header hideBackIcon subHeadingText={'did you plant?'} textAlignStyle={{ textAlign: 'center', }} />
                    </View>
                </View>
                <KeyboardAvoidingView
                    behavior={Platform.OS == "ios" ? "padding" : "height"}
                    style={styles.bgWhite}>
                    <View style={styles.externalInputContainer}>
                        <Text style={styles.labelModal}>{'Tree Count'}</Text>
                        <TextInput value={treeCount} style={styles.value} autoFocus placeholderTextColor={Colors.TEXT_COLOR} onChangeText={(text) => setTreeCount(text)} keyboardType={'number-pad'} />
                        <MCIcon onPress={onPressTreeCountNextBtn} name={'arrow-right'} size={30} color={Colors.PRIMARY} />
                    </View>
                    <SafeAreaView />
                </KeyboardAvoidingView>
            </Modal>
        )
    }

    const onPressContinue = () => {
        let selectedspeciesList = []
        for (let i = 0; i < speciesList.length; i++) {
            const oneSpecie = speciesList[i];
            if (oneSpecie.treeCount) {
                oneSpecie.id = i.toString()
                selectedspeciesList.push(oneSpecie)
            }
        }
        onPressSaveAndContinue(selectedspeciesList)
        setTimeout(() => {
            setActiveSpecie(undefined)
            setIsShowTreeCountModal(false)
            setTreeCount('')
            closeSelectSpeciesModal()
            setSpeciesList([...speciesJSON])
        }, 10)
    }

    return (
        <Modal
            visible={visible}
            animationType={'slide'}>
            <View style={{ flex: 1 }}>
                <SafeAreaView style={styles.mainContainer}>
                    <View style={styles.container}>
                        <Header onBackPress={closeSelectSpeciesModal} closeIcon headingText={'Species'} subHeadingText={'Please select the species that has been planted'} />
                        <FlatList style={{ flex: 1 }} data={speciesList} showsVerticalScrollIndicator={false} renderItem={renderSpeciesCard} />
                        <PrimaryButton onPress={onPressContinue} btnText={'Save & Continue'} />
                    </View>
                </SafeAreaView>
            </View>
            {renderTreeCountModal()}
        </Modal>
    )
}
export default SelectSpecies;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    },
    mainContainer: {
        flex: 1, backgroundColor: Colors.WHITE
    },
    speciesName: {
        marginVertical: 10,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
    },
    treeCount: {
        color: Colors.PRIMARY,
        fontSize: Typography.FONT_SIZE_16,
    },
    externalInputContainer: {
        flexDirection: 'row',
        height: 65,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 25,
        borderTopWidth: .5,
        borderColor: Colors.TEXT_COLOR
    },
    value: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_20,
        color: Colors.TEXT_COLOR,
        fontWeight: Typography.FONT_WEIGHT_MEDIUM,
        flex: 1,
        paddingVertical: 10,
    },
    labelModal: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
        color: Colors.TEXT_COLOR,
        marginRight: 10
    },
})

const speciesJSON = [
    { nameOfTree: "Aardvark" },
    { nameOfTree: "Albatross" },
    { nameOfTree: "Alligator" },
    { nameOfTree: "Alpaca" },
    { nameOfTree: "Ant" },
    { nameOfTree: "Anteater" },
    { nameOfTree: "Antelope" },
    { nameOfTree: "Ape" },
    { nameOfTree: "Armadillo" },
    { nameOfTree: "Donkey" },
    { nameOfTree: "Baboon" },
    { nameOfTree: "Badger" },
    { nameOfTree: "Barracuda" },
    { nameOfTree: "Bat" },
    { nameOfTree: "Bear" },
    { nameOfTree: "Beaver" },
    { nameOfTree: "Bee" },
    { nameOfTree: "Bison" },
    { nameOfTree: "Boar" },
    { nameOfTree: "Buffalo" },
    { nameOfTree: "Butterfly" },
    { nameOfTree: "Camel", },
    { nameOfTree: "Capybara", },
    { nameOfTree: "Caribou", },
    { nameOfTree: "Cassowary", },
    { nameOfTree: "Cat", },
    { nameOfTree: "Caterpillar", },
    { nameOfTree: "Cattle", },
    { nameOfTree: "Chamois", },
    { nameOfTree: "Cheetah", },
    { nameOfTree: "Chicken", },
    { nameOfTree: "Chimpanzee", },
    { nameOfTree: "Chinchilla", },
    { nameOfTree: "Chough", },
    { nameOfTree: "Clam", },
    { nameOfTree: "Cobra", },
    { nameOfTree: "Cockroach", },
    { nameOfTree: "Cod", },
    { nameOfTree: "Cormorant", },
    { nameOfTree: "Coyote", },
    { nameOfTree: "Crab", },
    { nameOfTree: "Crane", },
    { nameOfTree: "Crocodile", },
    { nameOfTree: "Crow", },
    { nameOfTree: "Curlew", },
    { nameOfTree: "Deer", },
    { nameOfTree: "Dinosaur", },
    { nameOfTree: "Dog", },
    { nameOfTree: "Dogfish", },
    { nameOfTree: "Dolphin", },
    { nameOfTree: "Dotterel", },
    { nameOfTree: "Dove", },
    { nameOfTree: "Dragonfly", },
    { nameOfTree: "Duck", },
    { nameOfTree: "Dugong", },
    { nameOfTree: "Dunlin", },
    { nameOfTree: "Eagle", },
    { nameOfTree: "Echidna", },
    { nameOfTree: "Eel", },
    { nameOfTree: "Eland", },
    { nameOfTree: "Elephant", },
    { nameOfTree: "Elk", },
    { nameOfTree: "Emu", },
    { nameOfTree: "Falcon", },
    { nameOfTree: "Ferret", },
    { nameOfTree: "Finch", },
    { nameOfTree: "Fish", },
    { nameOfTree: "Flamingo", },
    { nameOfTree: "Fly", },
    { nameOfTree: "Fox", },
    { nameOfTree: "Frog", },
    { nameOfTree: "Gaur", },
    { nameOfTree: "Gazelle", },
    { nameOfTree: "Gerbil", },
    { nameOfTree: "Giraffe", },
    { nameOfTree: "Gnat", },
    { nameOfTree: "Gnu", },
    { nameOfTree: "Goat", },
    { nameOfTree: "Goldfinch", },
    { nameOfTree: "Goldfish", },
    { nameOfTree: "Goose", },
    { nameOfTree: "Gorilla", },
    { nameOfTree: "Goshawk", },
    { nameOfTree: "Grasshopper", },
    { nameOfTree: "Grouse", },
    { nameOfTree: "Guanaco", },
    { nameOfTree: "Gull", },
    { nameOfTree: "Hamster", },
    { nameOfTree: "Hare", },
    { nameOfTree: "Hawk", },
    { nameOfTree: "Hedgehog", },
    { nameOfTree: "Heron", },
    { nameOfTree: "Herring", },
    { nameOfTree: "Hippopotamus", },
    { nameOfTree: "Hornet", },
    { nameOfTree: "Horse", },
    { nameOfTree: "Human", },
    { nameOfTree: "Hummingbird", },
    { nameOfTree: "Hyena", },
    { nameOfTree: "Ibex", },
    { nameOfTree: "Ibis", },
    { nameOfTree: "Jackal", },
    { nameOfTree: "Jaguar", },
    { nameOfTree: "Jay", },
    { nameOfTree: "Jellyfish", },
    { nameOfTree: "Kangaroo", },
    { nameOfTree: "Kingfisher", },
    { nameOfTree: "Koala", },
    { nameOfTree: "Kookabura", },
    { nameOfTree: "Kouprey", },
    { nameOfTree: "Kudu", },
    { nameOfTree: "Lapwing", },
    { nameOfTree: "Lark", },
    { nameOfTree: "Lemur", },
    { nameOfTree: "Leopard", },
    { nameOfTree: "Lion", },
    { nameOfTree: "Llama", },
    { nameOfTree: "Lobster", },
    { nameOfTree: "Locust", },
    { nameOfTree: "Loris", },
    { nameOfTree: "Louse", },
    { nameOfTree: "Lyrebird", },
    { nameOfTree: "Magpie", },
    { nameOfTree: "Mallard", },
    { nameOfTree: "Manatee", },
    { nameOfTree: "Mandrill", },
    { nameOfTree: "Mantis", },
    { nameOfTree: "Marten", },
    { nameOfTree: "Meerkat", },
    { nameOfTree: "Mink", },
    { nameOfTree: "Mole", },
    { nameOfTree: "Mongoose", },
    { nameOfTree: "Monkey", },
    { nameOfTree: "Moose", },
    { nameOfTree: "Mosquito", },
    { nameOfTree: "Mouse", },
    { nameOfTree: "Mule", },
    { nameOfTree: "Narwhal", },
    { nameOfTree: "Newt", },
    { nameOfTree: "Nightingale", },
    { nameOfTree: "Octopus", },
    { nameOfTree: "Okapi", },
    { nameOfTree: "Opossum", },
    { nameOfTree: "Oryx", },
    { nameOfTree: "Ostrich", },
    { nameOfTree: "Otter", },
    { nameOfTree: "Owl", },
    { nameOfTree: "Oyster", },
    { nameOfTree: "Panther", },
    { nameOfTree: "Parrot", },
    { nameOfTree: "Partridge", },
    { nameOfTree: "Peafowl", },
    { nameOfTree: "Pelican", },
    { nameOfTree: "Penguin", },
    { nameOfTree: "Pheasant", },
    { nameOfTree: "Pig", },
    { nameOfTree: "Pigeon", },
    { nameOfTree: "Pony", },
    { nameOfTree: "Porcupine", },
    { nameOfTree: "Porpoise", },
    { nameOfTree: "Quail", },
    { nameOfTree: "Quelea", },
    { nameOfTree: "Quetzal", },
    { nameOfTree: "Rabbit", },
    { nameOfTree: "Raccoon", },
    { nameOfTree: "Rail", },
    { nameOfTree: "Ram", },
    { nameOfTree: "Rat", },
    { nameOfTree: "Raven", },
    { nameOfTree: "Red deer", },
    { nameOfTree: "Red panda", },
    { nameOfTree: "Reindeer", },
    { nameOfTree: "Rhinoceros", },
    { nameOfTree: "Rook", },
    { nameOfTree: "Salamander", },
    { nameOfTree: "Salmon", },
    { nameOfTree: "Sand Dollar", },
    { nameOfTree: "Sandpiper", },
    { nameOfTree: "Sardine", },
    { nameOfTree: "Scorpion", },
    { nameOfTree: "Seahorse", },
    { nameOfTree: "Seal", },
    { nameOfTree: "Shark", },
    { nameOfTree: "Sheep", },
    { nameOfTree: "Shrew", },
    { nameOfTree: "Skunk", },
    { nameOfTree: "Snail", },
    { nameOfTree: "Snake", },
    { nameOfTree: "Sparrow", },
    { nameOfTree: "Spider", },
    { nameOfTree: "Spoonbill", },
    { nameOfTree: "Squid", },
    { nameOfTree: "Squirrel", },
    { nameOfTree: "Starling", },
    { nameOfTree: "Stingray", },
    { nameOfTree: "Stinkbug", },
    { nameOfTree: "Stork", },
    { nameOfTree: "Swallow", },
    { nameOfTree: "Swan", },
    { nameOfTree: "Tapir", },
    { nameOfTree: "Tarsier", },
    { nameOfTree: "Termite", },
    { nameOfTree: "Tiger", },
    { nameOfTree: "Toad", },
    { nameOfTree: "Trout", },
    { nameOfTree: "Turkey", },
    { nameOfTree: "Turtle", },
    { nameOfTree: "Viper", },
    { nameOfTree: "Vulture", },
    { nameOfTree: "Wallaby", },
    { nameOfTree: "Walrus", },
    { nameOfTree: "Wasp", },
    { nameOfTree: "Weasel", },
    { nameOfTree: "Whale", },
    { nameOfTree: "Wildcat", },
    { nameOfTree: "Wolf", },
    { nameOfTree: "Wolverine", },
    { nameOfTree: "Wombat", },
    { nameOfTree: "Woodcock", },
    { nameOfTree: "Woodpecker", },
    { nameOfTree: "Worm", },
    { nameOfTree: "Wren", },
    { nameOfTree: "Yak", },
    { nameOfTree: "Zebra" },
]