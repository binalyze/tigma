class ConsoleLogger
{
  constructor()
  {
    this.debugLoggingEnabled = true;
  }
  
  setDebugLogging(enabled)
  {
    this.debugLoggingEnabled = enabled;
  }
  
  debug(message)
  {
    if(this.debugLoggingEnabled)
    {
      $('#log').prepend(`debug: ${message}</br>`);
    }
  }
  
  info(message)
  {
    $('#log').prepend(`info: ${message}</br>`);
  }
  
  warn(message)
  {
    $('#log').prepend(`warn: ${message}</br>`);
  }
  
  error(message)
  {
    $('#log').prepend(`<font color="red">error: ${message}</font></br>`);
  }
}
