import React from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ApiClient } from '@treemapper/api/client'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { Button, Input, Text, YStack } from 'tamagui'
import FormField from '../../../components/forms/FormField'

type UserResponse = {
  user: {
    fullName: string
    email: string
  }
}

type FormData = {
  fullName: string
  email: string
}

export default function ProfileForm() {
  const apiClient = ApiClient.getInstance()

  const { data, isLoading, refetch } = useQuery<UserResponse | null>({
    queryKey: ['user.me'],
    queryFn: async () => {
      const response = await apiClient.get<UserResponse>('/api/users/me')
      return response.data || null
    },
  })

  const { mutate } = useMutation({
    mutationKey: ['user.me.update'],
    mutationFn: async (data: Partial<FormData>) => {
      await apiClient.put('/api/users/me', data)
    },
    onMutate: () => {
      refetch()
    },
  })

  const {
    handleSubmit,
    watch,
    control,
    formState: { errors, isDirty, isSubmitting, dirtyFields },
  } = useForm<FormData>({
    values: {
      fullName: data?.user?.fullName || '',
      email: data?.user?.email || '',
    },
  })

  const onSubmit: SubmitHandler<FormData> = async data => {
    const changedData = Object.keys(dirtyFields).reduce((acc, key) => {
      acc[key] = data[key]
      return acc
    }, {} as Partial<FormData>)

    mutate(changedData)
  }

  const onError = (errors, e) => {
    return console.log(errors)
  }

  if (isLoading) {
    return (
      <YStack>
        <Text>Loading</Text>
      </YStack>
    )
  }

  return (
    <YStack>
      {/* <Text>{JSON.stringify(watch(), null, 2)}</Text> */}
      <Controller
        control={control}
        name="fullName"
        render={({ field: { name, onChange, value } }) => (
          <FormField
            id={name}
            label="Full Name"
            // helperText="Some Help..."
            // errorText="Some Error!"
          >
            <Input id={name} value={value} onChangeText={onChange} />
          </FormField>
        )}
        rules={{ required: true }}
      />
      <Controller
        control={control}
        disabled
        name="email"
        render={({ field: { name, onChange, value } }) => (
          <FormField id={name} label="Email">
            <Input id={name} value={value} onChangeText={onChange} />
          </FormField>
        )}
        rules={{ required: true }}
      />

      <YStack marginTop="$4">
        <Button
          disabled={isSubmitting || !isDirty}
          onPress={handleSubmit(onSubmit)}>
          Update Profile
        </Button>
      </YStack>

      {/* <Text>{JSON.stringify(data, null, 2)}</Text> */}
    </YStack>
  )
}
