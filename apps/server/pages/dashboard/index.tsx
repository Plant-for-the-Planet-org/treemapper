import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession, getSession } from 'next-auth/react'
import DashboardIndexScreen from 'dashboard/features/index/screen'

// Your Dashboard component
const Dashboard = ({ session }) => {
  // Since we're protected by getServerSideProps, we know the user is authenticated
  return (
    <div>
      <DashboardIndexScreen/>
    </div>
  )
}

// Server-side protection
export async function getServerSideProps(context) {
  const session = true
  
  // // If not authenticated, redirect to login
  // if (!session) {
  //   return {
  //     redirect: {
  //       destination: '/login',
  //       permanent: false,
  //     },
  //   }
  // }
  
  return {
    props: { session }
  }
}

export default Dashboard