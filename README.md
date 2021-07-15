# ioBroker.SetShutterLevel-HomematicIP
Verwendung von Homematic IP gesteuerten Jalousien in Kombination mit dem ShutterControl Adapter

Da mir die Verwendung über Alias zu aufwendig erschien, habe ich dies wie folgt gelöst:

- Das Script erstellt für jede Jalousie einen Datenpunkt "State". Dieser Datenpunkt wird in ShutterControll als Level-Datenpunkt verwendet.
- Im Script definiert man für verschiedene "Level-Werte" zum einen die Behanghöhe der Jalousie, zum Anderen die Lamellenposition
- Das Script setzt darauf hin einen Parameter-Wert, mit diesem dann der HomematicIP-Datenpunkt "COMBINED_PARAMETER" gesteuert wird

Beispiele sind im Script schon angegeben. Es lassen sich beliebig viele Positionen setzen.
Zudem gibt es einen weiteren Datenpunkt "BlindLevel". Mit diesem lassen sich nur die Lamellen verstellen. Ideal z.B. für die VIS o.ä.

Wichtig bei der Einrichtung ist, dass man nur den Channel des HmIP Aktors im Script setzt und nicht direkt den Datenpunkt für die Parameter. (Siehe Beispiel im Script)

Getestet habe ich dies aktuell nur mit HmIPW-DRBL da ich keine anderen in Verwendung habe. Aber über eine Rückmeldung, ob dies auch mit dem HmIP-FBL oder BBL funktioniert und ob es dor auch den "COMBINED_PARAMETER" gibt.
