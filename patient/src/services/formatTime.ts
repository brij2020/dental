const formatTime = (time: string) => {
    if (!time || !time.includes(":")) return ""

    const [hh, mm] = time.split(":")

    const hourNum = Number(hh)
    const formattedHour = ((hourNum % 12) || 12).toString().padStart(2, "0")
    const period = hourNum < 12 ? "AM" : "PM"

    return `${formattedHour}:${mm} ${period}`
}

export default formatTime;