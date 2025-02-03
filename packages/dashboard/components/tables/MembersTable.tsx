import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import React from 'react'
import { Link } from 'solito/link'
import { useRouter } from 'solito/router'
import { Avatar, Button, Text, useMedia, View } from 'tamagui'
import { Table } from './Table'

type Person = {
  name: string
  role: string
  project: string
  avatar?: string
}

const defaultData: Person[] = [
  {
    name: 'Sara Smith',
    project: 'Yucatan - Las Americas 1',
    role: 'Admin',
  },
  {
    name: 'Andy loren',
    project: 'Yucatan - Las Americas 1',
    role: 'Member',
  },
  {
    name: 'Bob marley',
    project: 'Yucatan - Las Americas 2',
    role: 'Admin',
  },
].map(
  (row, index) =>
    ({
      ...row,
      avatar: `/avatars/300 (1).jpeg`,
    }) as Person,
)

const columnHelper = createColumnHelper<Person>()

const columns = [
  columnHelper.accessor(
    row => ({
      name: row.name,
      image: row.avatar,
    }),
    {
      cell: info => {
        const { name, image } = info.getValue()
        return (
          <View
            flexDirection="row"
            alignItems="center"
            gap="$2"
            marginLeft="$2">
            <Avatar circular size="$4" marginRight="$2">
              <Avatar.Image accessibilityLabel="Profile image" src={image} />
              <Avatar.Fallback backgroundColor="$gray6" />
            </Avatar>
            <View flexDirection="column">
              <Text>{name}</Text>
            </View>
          </View>
        )
      },
      header: () => 'NAME',
      id: 'user_base',
    },
  ),
  columnHelper.accessor('project', {
    header: 'PROJECT',
    footer: info => info.column.id,
  }),
  columnHelper.accessor('role', {
    header: 'ROLE',
    footer: info => info.column.id,
  }),
]

export function MembersTable() {
  const router = useRouter()

  const [data, setData] = React.useState(() => [...defaultData])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const headerGroups = table.getHeaderGroups()
  const tableRows = table.getRowModel().rows
  const footerGroups = table.getFooterGroups()

  const allRowsLenght =
    tableRows.length + headerGroups.length + footerGroups.length
  const rowCounter = React.useRef(-1)
  rowCounter.current = -1
  const { sm, xs } = useMedia()

  // if (sm) {
  //   return (
  //     <View
  //       width="100%"
  //       flexDirection="column"
  //       justifyContent="center"
  //       gap="$5"
  //       paddingVertical="$6">
  //       {defaultData.map((row, i) => {
  //         return (
  //           <View
  //             key={i}
  //             borderRadius="$4"
  //             borderWidth="$1"
  //             borderColor="$borderColor"
  //             flex={1}
  //             alignSelf="stretch"
  //             width="100%"
  //             gap="$2"
  //             paddingTop="$2">
  //             <XStack
  //               alignItems="center"
  //               paddingVertical="$1"
  //               marginLeft="$3"
  //               gap="$2">
  //               <Avatar circular size="$3">
  //                 <Avatar.Image
  //                   accessibilityLabel="Profile image"
  //                   src={row.avatar}
  //                 />
  //                 <Avatar.Fallback backgroundColor="$gray6" />
  //               </Avatar>
  //               <View justifyContent="space-between">
  //                 <Text>{row.name}</Text>
  //               </View>
  //             </XStack>

  //             <View height={2} backgroundColor="$borderColor" />

  //             <View gap="$2">
  //               {Object.entries(row)
  //                 .filter(
  //                   ([name]) =>
  //                     !['avatar', 'fullName', 'username', 'status'].includes(
  //                       name,
  //                     ),
  //                 )
  //                 .map(([name, value], i) => {
  //                   return (
  //                     <View key={i}>
  //                       <View
  //                         flexDirection="row"
  //                         justifyContent="space-between"
  //                         marginHorizontal="$3"
  //                         paddingBottom="$2">
  //                         <Text>
  //                           {name.charAt(0).toUpperCase() + name.slice(1)}
  //                         </Text>
  //                         <Text color="$gray10">{value}</Text>
  //                       </View>
  //                       {i !==
  //                         Object.entries(row).filter(
  //                           ([name]) => !['name'].includes(name),
  //                         ).length -
  //                           1 && <Separator />}
  //                     </View>
  //                   )
  //                 })}
  //             </View>
  //           </View>
  //         )
  //       })}
  //     </View>
  //   )
  // }

  return (
    <Table
      overflow="scroll"
      alignCells={{ x: 'center', y: 'center' }}
      alignHeaderCells={{ y: 'center', x: 'center' }}
      gap="$2">
      <Table.Head>
        {headerGroups.map(headerGroup => {
          rowCounter.current++
          return (
            <Table.Row
              rowLocation={
                rowCounter.current === 0
                  ? 'first'
                  : rowCounter.current === allRowsLenght - 1
                    ? 'last'
                    : 'middle'
              }
              key={headerGroup.id}
              justifyContent="flex-start">
              {headerGroup.headers.map(header => (
                <Table.HeaderCell
                  cellLocation={
                    header.id === 'name'
                      ? 'first'
                      : header.id === 'role'
                        ? 'last'
                        : 'middle'
                  }
                  key={header.id}
                  borderWidth={0}
                  justifyContent="flex-start"
                  {...(header.column.id === 'user_base'
                    ? { flexShrink: 1 }
                    : { flexShrink: 3 })}>
                  <Text>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </Text>
                </Table.HeaderCell>
              ))}
            </Table.Row>
          )
        })}
        <Table.Row>
          <Table.HeaderCell>
            <Text>ACTIONS</Text>
          </Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {tableRows.map(row => {
          rowCounter.current++
          return (
            <Table.Row
              // hoverStyle={{
              //   backgroundColor: '$color2',
              // }}
              // rowLocation={
              //   rowCounter.current === 0
              //     ? 'first'
              //     : rowCounter.current === allRowsLenght - 1
              //       ? 'last'
              //       : 'middle'
              // }
              key={row.id}>
              {row.getVisibleCells().map(cell => (
                <Table.Cell
                  cellLocation={
                    cell.column.id === 'name'
                      ? 'first'
                      : cell.column.id === 'role'
                        ? 'last'
                        : 'middle'
                  }
                  key={cell.id}
                  borderWidth={0}
                  justifyContent="flex-start"
                  {...(cell.column.id === 'user_base'
                    ? { flexShrink: 1 }
                    : { flexShrink: 3 })}>
                  {cell.column.id === 'user_base' ? (
                    flexRender(cell.column.columnDef.cell, cell.getContext())
                  ) : (
                    <Text>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </Text>
                  )}
                </Table.Cell>
              ))}
              <Table.Cell>
                <Button
                // onPress={() => {
                //   router.push(`/dashboard/teams/members/${row.id}`)
                // }}
                >
                  <Link href={`/dashboard/teams/members/${row.id}`}>
                    <Text>Update</Text>
                  </Link>
                </Button>
              </Table.Cell>
            </Table.Row>
          )
        })}
      </Table.Body>
    </Table>
  )
}
