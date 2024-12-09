import ClientNavItems from '@/components/client-comps/ClientNavItems'
import TopArtisans from '@/components/client-comps/TopArtisans'
import React from 'react'

const ClientHomePage: React.FC = () => {
  return (

    <>
      <section>
        <ClientNavItems />
        <TopArtisans />
      </section>
    </>
  )
}

export default ClientHomePage