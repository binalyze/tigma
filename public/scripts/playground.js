let engine = null;

let logger =
{
  debugLoggingEnabled: true,
  setDebugLogging: (enabled) =>
  {
    this.debugLoggingEnabled = enabled;
  },
  debug: (message) =>
  {
    if(this.debugLoggingEnabled)
    {
      $('#log').prepend(`debug: ${message}</br>`);
    }
  },
  info: (message) =>
  {
    $('#log').prepend(`info: ${message}</br>`);
  },
  warn: (message) =>
  {
    $('#log').prepend(`warn: ${message}</br>`);
  },
  error: (message) =>
  {
    $('#log').prepend(`<font color="red">error: ${message}</font></br>`);
  }
};

function main()
{
  initUI();
  
  engine = createEngine({logger: logger});
  
  if(!engine)
  {
    throw new Error(`Can not create Engine instance`);
  }
  
  parseRule();
}

function viewJSON(json, targetElement)
{
  $(targetElement).jsonViewer(json);
}

function clearLog()
{
  //TODO(emre): implement this
}

function setRuleStatus(isValid)
{
  if(isValid)
  {
    $('#rule-status').removeClass('badge-danger')
                     .addClass('badge-success')
                     .html('Valid Rule');
  }
  else
  {
    $('#rule-status').removeClass('badge-success')
                     .addClass('badge-danger')
                     .html('Invalid Rule');
  }
}

function setMatchResult(isMatched)
{
  if(isMatched)
  {
    $('#match-result').removeClass('alert-danger')
    .addClass('alert-success')
    .html('Scan result: DETECTED');
  }
  else
  {
    $('#match-result').removeClass('alert-success')
    .addClass('alert-danger')
    .html('Scan result: NO MATCH');
  }
}

function parseRule()
{
  // Clear for now
  viewJSON(null, '#rule-parsed');
  setRuleStatus(false);
  setMatchResult(false);
  
  const ruleContent = $('#rule-yaml').val();
  
  const rule = engine.load(ruleContent);
  
  if(!rule)
  {
    logger.error(`Rule parsing failed`);
    return;
  }
  
  const conditions = engine.parse(rule);
  
  if(!conditions || conditions.length === 0)
  {
    logger.error(`Condition array is empty`);
    return;
  }
  
  viewJSON(conditions, '#rule-parsed');
  
  setRuleStatus(true);
  
  const matched = engine.scan(rule, caseJSON);
  
  setMatchResult(matched);
  
  logger.info(`Rule parsing succeeded`);
}

function loadTemplateRule(name)
{
  const ruleContent = $(`#template-rules > #${name}`).html().trim();
  
  $('#rule-yaml').val(ruleContent);
}

function initUI()
{
  $('.dropdown-toggle').dropdown();
  $('#rule-yaml').on('change keyup paste', parseRule);
  $('#rule-status').html('Valid Rule');
  
  $('.dropdown-menu a').click(function()
  {
    const ruleName = $(this).data('rule');
  
    loadTemplateRule(ruleName);
    
    $('#examples').text($(this).text());
    
    parseRule();
  });
  
  loadTemplateRule('minimal');
}

$(document).ready(main);
