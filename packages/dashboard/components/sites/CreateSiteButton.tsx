import { Button, Image } from 'tamagui'

const Plus = require('../../../public/images/plus.png')


function CreateSiteButton() {
  return (
    <Button
      icon={() => (<Image
        src={Plus}
        width={16}
        height={16}
        tintColor={'#fff'}
      />)}
      size="$5"
      backgroundColor="#007A49"
      color="white"
      borderRadius="$3"
      fontSize="$6"
      fontWeight="bold"
      paddingHorizontal="$6"
      width={'100%'}
      hoverStyle={{ backgroundColor: "#E1EDE8" }}
      pressStyle={{ backgroundColor: "#E1EDE8" }}
      onPress={() => console.log("Button Pressed")}
      position="absolute"
      bottom={30}  // Adjust spacing from bottom
      alignSelf="center" // Center horizontally
    >
      Create a new site
    </Button>
  )
}

export default CreateSiteButton;