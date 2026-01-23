const Loading = ({size}) => {
  return (
    <div style={{height: size}} className={`flex items-center w-full justify-center bg-transparent`}>
      <div className="w-6 h-6 border-4 border-gray-300 border-t-cyan-600 rounded-full animate-spin mx-auto"></div>

    </div>

  )
}

export default Loading