import React, { ReactNode } from 'react'

function layout({children}:{children:ReactNode}) {
  return (
    <div className='  h-screen w-screen bg-neutral-800   p-10 '>
        <div className='w-full h-full border-2 rounded-3xl  bg-neutral-900 p-2 '>
        {children}
        </div>
    </div>
  )
}

export default layout